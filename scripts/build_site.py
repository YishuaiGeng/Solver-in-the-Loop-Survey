#!/usr/bin/env python3
"""Build the static project site from the public companion repository."""
import argparse
from datetime import date
from html import escape
from pathlib import Path
from shutil import copyfile
from string import Template

from render import ROLES, ROOT, load

REPOSITORY = "https://github.com/YishuaiGeng/Solver-in-the-Loop-Survey"
PUBLIC_DOWNLOADS = (
    "assets/branding/solver-in-the-loop.svg",
    "assets/branding/solver-in-the-loop-mascot.svg",
    "assets/figures/overview.png",
    "data/papers.csv",
    "data/papers.json",
    "references/references.bib",
)


def make_index():
    snapshot = load("data/snapshot.json")
    manuscript = load("manuscript/links.json")
    start = date.fromisoformat(snapshot["eligibility_start"]).strftime("%B %Y")
    end = date.fromisoformat(snapshot["eligibility_end"]).strftime("%B %Y")
    links = [
        f'<a class="button" href="{escape(manuscript[key])}">{label}</a>'
        for key, label in (
            ("arxiv_url", "arXiv"),
            ("pdf_url", "Paper PDF"),
            ("doi_url", "Publication"),
        )
        if manuscript[key] != "not_reported"
    ]
    if manuscript["arxiv_url"] == "not_reported":
        links.insert(0, '<span class="button pending" aria-disabled="true">arXiv · coming soon</span>')

    citation = (ROOT / "README.md").read_text(encoding="utf-8").split("```bibtex\n", 1)[1]
    bibtex = citation.split("\n```", 1)[0]
    template = Template((ROOT / "site/index.html").read_text(encoding="utf-8"))
    return template.substitute(
        repository=REPOSITORY,
        study_count=f'{snapshot["studies"]:,}',
        coverage=f"{start}–{end}",
        paper_links="\n          ".join(links),
        role_links="\n        ".join(
            f'<a class="role-card" href="{REPOSITORY}/blob/main/papers/roles/{slug}.md">'
            f'<span class="role-code">{code}</span><strong>{escape(name)}</strong>'
            f'<span class="role-count">{snapshot["roles"][code]:,} studies</span>'
            f'<span class="role-summary">{escape(summary)}</span></a>'
            for code, (slug, name, summary) in ROLES.items()
        ),
        role_options="\n                ".join(
            f'<option value="{code}">{escape(name)}</option>'
            for code, (_, name, _) in ROLES.items()
        ),
        resource_count=f'{snapshot["benchmark_resources"]:,}',
        reference_count=f'{snapshot["manuscript_references"]:,}',
        bibtex=escape(bibtex, quote=False),
    )


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("output", type=Path, help="Empty directory for the generated site")
    output = parser.parse_args().output
    output.mkdir(parents=True, exist_ok=True)
    if any(output.iterdir()):
        parser.error(f"Output directory must be empty: {output}")
    (output / "index.html").write_text(make_index(), encoding="utf-8")
    for name in ("style.css", "catalogue.js"):
        copyfile(ROOT / "site" / name, output / name)
    for name in PUBLIC_DOWNLOADS:
        target = output / name
        target.parent.mkdir(parents=True, exist_ok=True)
        copyfile(ROOT / name, target)
    (output / ".nojekyll").touch()


if __name__ == "__main__":
    main()
