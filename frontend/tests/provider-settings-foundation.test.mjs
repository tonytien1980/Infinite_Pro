import test from "node:test";
import assert from "node:assert/strict";

import * as providerSettings from "../src/lib/provider-settings.ts";
import {
  buildProviderDraftFromCurrent,
  getSettingsProviderVisibility,
  labelForProviderSource,
  summarizeAllowlistEntry,
} from "../src/lib/provider-settings.ts";

test("owner sees both firm and personal provider settings sections", () => {
  assert.deepEqual(getSettingsProviderVisibility("owner"), {
    showFirmSettings: true,
    showPersonalSettings: true,
  });
  assert.deepEqual(getSettingsProviderVisibility("consultant"), {
    showFirmSettings: false,
    showPersonalSettings: true,
  });
});

test("personal provider source label is rendered in Traditional Chinese", () => {
  assert.equal(
    labelForProviderSource({
      source: "personal_config",
      providerId: "openai",
      providerDisplayName: "OpenAI",
      modelLevel: "balanced",
      actualModelId: "gpt-5.4-mini",
      customModelId: null,
      baseUrl: "https://api.openai.com/v1",
      timeoutSeconds: 60,
      apiKeyConfigured: true,
      apiKeyMasked: "••••1234",
      lastValidationStatus: "success",
      lastValidationMessage: "ok",
      lastValidatedAt: null,
      updatedAt: null,
      keyUpdatedAt: null,
      presetRuntimeSupportLevel: "verified",
      usingEnvBaseline: false,
    }),
    "個人模型設定",
  );
});

test("provider draft prefers the current personal model when present", () => {
  const draft = buildProviderDraftFromCurrent({
    current: {
      source: "personal_config",
      providerId: "openai",
      providerDisplayName: "OpenAI",
      modelLevel: "balanced",
      actualModelId: "gpt-5.4-mini",
      customModelId: null,
      baseUrl: "https://api.openai.com/v1",
      timeoutSeconds: 60,
      apiKeyConfigured: true,
      apiKeyMasked: "••••1234",
      lastValidationStatus: "success",
      lastValidationMessage: "ok",
      lastValidatedAt: null,
      updatedAt: null,
      keyUpdatedAt: null,
      presetRuntimeSupportLevel: "verified",
      usingEnvBaseline: false,
    },
    presets: [
      {
        providerId: "openai",
        displayName: "OpenAI",
        defaultBaseUrl: "https://api.openai.com/v1",
        defaultTimeoutSeconds: 60,
        authSchemeType: "bearer",
        adapterKind: "openai_native",
        runtimeSupportLevel: "verified",
        validationSupportLevel: "verified",
        recommendedModels: {
          high_quality: "gpt-5.4",
          balanced: "gpt-5.4-mini",
          low_cost: "gpt-5.4-nano",
        },
      },
    ],
  });

  assert.equal(draft.providerId, "openai");
  assert.equal(draft.modelId, "gpt-5.4-mini");
  assert.equal(draft.baseUrl, "https://api.openai.com/v1");
});

test("allowlist summary explains explicit model scope", () => {
  assert.equal(
    summarizeAllowlistEntry({
      providerId: "openai",
      modelLevel: "balanced",
      allowedModelIds: ["gpt-5.4-mini"],
      allowCustomModel: false,
      status: "active",
    }),
    "gpt-5.4-mini",
  );
});

test("provider fallback explanation keeps personal key priority and firm fallback readable", () => {
  assert.equal(
    providerSettings.buildProviderFallbackExplanation?.("consultant"),
    "你可以使用自己的模型金鑰；沒有設定時，系統會使用事務所預設模型。",
  );
  assert.equal(
    providerSettings.buildProviderFallbackExplanation?.("owner"),
    "事務所預設模型會作為沒有個人金鑰時的備援。",
  );
  assert.equal(
    providerSettings.buildProviderFallbackExplanation?.("demo"),
    "示範帳號不能執行正式分析。",
  );
});
