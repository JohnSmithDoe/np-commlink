"""Tests for block-whole-tree-git.sh — run: python3 .claude/hooks/block-whole-tree-git.test.py

The hook greps the whole Bash command string, which means DATA can look like a
command: the hook blocked its own first commit because the message quoted
`git reset --hard`. That is why the heredoc cases below exist, and why the test
builds every case from a `git` variable — a literal here would trip the gate
while the suite is being edited.
"""
import json, pathlib, subprocess, sys

HOOK = str(pathlib.Path(__file__).with_name('block-whole-tree-git.sh'))

G = 'git'  # kept as a variable so this file's own text is not the point
HEREDOC_QUOTING_THE_DANGER = (
    f"{G} commit -q -F - <<'EOF' && {G} log --oneline -1\n"
    f"Today I ran {G} reset --hard HEAD && {G} clean -fdq src by mistake.\n"
    f"Three {G} add -A calls swept in work that was not mine.\n"
    "EOF"
)
REAL_COMMAND_AFTER_HEREDOC = (
    f"{G} commit -F - <<'EOF'\nmessage body\nEOF\n{G} clean -fd"
)

BLOCK = [
    f'{G} reset --hard HEAD',
    f'cd /x; {G} reset --hard HEAD -q && {G} clean -fdq src',
    f'{G} clean -fd',
    f'{G} clean -xdf .',
    f'{G} checkout -- .',
    f'{G} checkout .',
    f'{G} checkout -f',
    f'{G} restore .',
    f'{G} add -A',
    f'{G} add -A -- docs/x.md',
    f'{G} add .',
    f'{G} add --all',
    f'{G} add -u',
    f'{G} commit -am "x"',
    f'{G} commit -a',
    REAL_COMMAND_AFTER_HEREDOC,
    # publishing — the one git operation that leaves this machine
    f'{G} push',
    f'{G} push origin main',
    f'{G} push --force-with-lease',
    f'{G} push -u origin HEAD',
    f'{G} push --dry-run',
    f'{G} -C /somewhere push',
    f'cd /x && {G} push && echo done',
]

PASS = [
    f'{G} add -- docs/architecture.md src/app/commlink',
    f'{G} checkout -- src/app/app.routes.ts',
    f'{G} commit -q -F -',
    f'{G} commit --amend --no-edit',
    f'{G} status --short',
    f'{G} stash push -- src/x.ts',
    f'{G} reset HEAD~1 --soft',
    f'{G} clean --dry-run -d',
    f'pnpm run lint && {G} log --oneline -3',
    f'{G} diff --cached --name-only',
    HEREDOC_QUOTING_THE_DANGER,
    # `stash push` is a local operation and must survive the push rule
    f'{G} stash push -- src/app/x.ts',
    f'{G} fetch origin',
    f'{G} log origin/main..HEAD --oneline',
    f'{G} rev-parse --abbrev-ref HEAD',
]


def blocked(cmd: str) -> bool:
    out = subprocess.run(
        ['bash', HOOK], input=json.dumps({'tool_input': {'command': cmd}}),
        capture_output=True, text=True,
    ).stdout.strip()
    return bool(out)


fails = 0
for expect_block, cases in ((True, BLOCK), (False, PASS)):
    for cmd in cases:
        got = blocked(cmd)
        label = cmd.splitlines()[0][:62]
        if got == expect_block:
            print(f'  {"block" if got else "pass ":6} ok   | {label}')
        else:
            fails += 1
            print(f'  !! WRONG ({"block" if got else "pass"}, wanted '
                  f'{"block" if expect_block else "pass"}) | {label}')

print(f'\n{len(BLOCK) + len(PASS)} cases, {fails} wrong')
sys.exit(1 if fails else 0)
