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
            DEFAULT_P0_INDUSTRY_BATCH1_MANIFEST,
            load_manifest,
            run_manifest,
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
    return DEFAULT_P0_INDUSTRY_BATCH1_MANIFEST, load_manifest, run_manifest


def main() -> int:
    default_manifest_path, load_manifest, run_manifest = _load_runner()
    parser = argparse.ArgumentParser(
        description="Run the minimal Infinite Pro benchmark scaffolding baseline."
    )
    parser.add_argument(
        "--manifest",
        default=str(default_manifest_path),
        help="Path to the benchmark manifest JSON.",
    )
    args = parser.parse_args()

    manifest = load_manifest(args.manifest)
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
