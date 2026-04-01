from __future__ import annotations

import argparse
import json
import os
import subprocess
import sys
from pathlib import Path

BACKEND_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND_ROOT))


def _load_runner():
    try:
        from app.benchmarks.runner import (
            DEFAULT_P0_FULL_REGRESSION_SUITE_MANIFEST,
            DEFAULT_P0_INDUSTRY_BATCH1_MANIFEST,
            load_manifest,
            load_suite,
            run_manifest,
            run_suite,
        )
    except ModuleNotFoundError as exc:
        if exc.name != "pydantic":
            raise
        venv_python = BACKEND_ROOT.parent / ".venv312" / "bin" / "python"
        if venv_python.exists() and Path(sys.executable) != venv_python:
            completed = subprocess.run(
                [str(venv_python), __file__, *sys.argv[1:]],
                check=False,
                env=os.environ.copy(),
            )
            raise SystemExit(completed.returncode) from exc
        raise
    return (
        DEFAULT_P0_INDUSTRY_BATCH1_MANIFEST,
        DEFAULT_P0_FULL_REGRESSION_SUITE_MANIFEST,
        load_manifest,
        load_suite,
        run_manifest,
        run_suite,
    )


def main() -> int:
    (
        default_manifest_path,
        default_suite_path,
        load_manifest,
        load_suite,
        run_manifest,
        run_suite,
    ) = _load_runner()
    parser = argparse.ArgumentParser(
        description="Run the minimal Infinite Pro benchmark scaffolding baseline."
    )
    parser.add_argument(
        "--manifest",
        default=None,
        help="Path to the benchmark manifest JSON.",
    )
    parser.add_argument(
        "--suite-manifest",
        default=None,
        help="Path to the benchmark suite manifest JSON.",
    )
    parser.add_argument(
        "--suite",
        choices=["full"],
        default=None,
        help="Run a named benchmark suite instead of a single manifest.",
    )
    args = parser.parse_args()

    if args.suite and args.suite_manifest:
        parser.error("--suite and --suite-manifest cannot be used together.")

    if args.suite == "full" or args.suite_manifest:
        suite = load_suite(args.suite_manifest or default_suite_path)
        result = run_suite(suite)
        print(
            json.dumps(
                result.model_dump(mode="json"),
                ensure_ascii=False,
                indent=2,
            )
        )
        return 0

    manifest = load_manifest(args.manifest or default_manifest_path)
    results = run_manifest(manifest)
    print(
        json.dumps(
            {
                "manifest_id": manifest.manifest_id,
                "case_count": len(manifest.cases),
                "results": [item.model_dump(mode="json") for item in results],
            },
            ensure_ascii=False,
            indent=2,
        )
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
