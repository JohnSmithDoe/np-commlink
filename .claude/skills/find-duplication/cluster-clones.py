#!/usr/bin/env python3
"""Cluster jscpd's pairwise clones into groups and rank them as refactor candidates.

jscpd reports duplication *pairwise*: a block living in files X, Y, Z shows up as
three separate clones (X-Y, X-Z, Y-Z). To reason about "one abstraction" you need
the group {X, Y, Z} and its size, not the pairs. This does that with union-find,
then ranks each group by how much code a single abstraction would eliminate.

Usage: python3 cluster-clones.py path/to/jscpd-report.json
"""

import json
import sys
from collections import defaultdict


class DSU:
    def __init__(self):
        self.p = {}

    def find(self, x):
        self.p.setdefault(x, x)
        root = x
        while self.p[root] != root:
            root = self.p[root]
        while self.p[x] != root:
            self.p[x], x = root, self.p[x]
        return root

    def union(self, a, b):
        ra, rb = self.find(a), self.find(b)
        if ra != rb:
            self.p[ra] = rb


def domain(name):
    """Top-level dir under the scan root == Sheriff domain (@shared stays @shared)."""
    return name.split("/", 1)[0]


def overlaps(a, b):
    return a["start"] <= b["end"] and b["start"] <= a["end"]


def main():
    if len(sys.argv) < 2:
        print("usage: cluster-clones.py <jscpd-report.json>", file=sys.stderr)
        sys.exit(2)

    with open(sys.argv[1]) as f:
        report = json.load(f)

    dups = report.get("duplicates", [])
    if not dups:
        print("No clones in report.")
        return

    # Every clone contributes two physical fragments; index them, remember the pair.
    frags = []
    pairs = []
    for d in dups:
        i1, i2 = len(frags), len(frags) + 1
        for side in (d["firstFile"], d["secondFile"]):
            frags.append(
                {
                    "name": side["name"],
                    "start": side["start"],
                    "end": side["end"],
                    "tokens": d["tokens"],
                    "lines": d["lines"],
                }
            )
        pairs.append((i1, i2))

    dsu = DSU()
    # 1) union the two sides of every clone
    for a, b in pairs:
        dsu.union(a, b)
    # 2) union fragments in the same file whose line ranges overlap
    #    (collapses the repeated X-entries that X-Y / X-Z produce)
    by_file = defaultdict(list)
    for idx, fr in enumerate(frags):
        by_file[fr["name"]].append(idx)
    for idxs in by_file.values():
        idxs.sort(key=lambda i: frags[i]["start"])
        for a, b in zip(idxs, idxs[1:]):
            if overlaps(frags[a], frags[b]):
                dsu.union(a, b)

    groups = defaultdict(list)
    for idx in range(len(frags)):
        groups[dsu.find(idx)].append(idx)

    clusters = []
    for members in groups.values():
        # merge overlapping same-file fragments into one physical location
        per_file = defaultdict(list)
        for i in members:
            per_file[frags[i]["name"]].append(frags[i])
        locations = []
        for name, fs in per_file.items():
            fs.sort(key=lambda x: x["start"])
            cur = dict(fs[0])
            for nxt in fs[1:]:
                if nxt["start"] <= cur["end"]:
                    cur["end"] = max(cur["end"], nxt["end"])
                    cur["tokens"] = max(cur["tokens"], nxt["tokens"])
                    cur["lines"] = max(cur["lines"], nxt["lines"])
                else:
                    locations.append(cur)
                    cur = dict(nxt)
            locations.append(cur)

        instances = len(locations)
        size = max(l["tokens"] for l in locations)
        lines = max(l["lines"] for l in locations)
        eliminated = (instances - 1) * size  # tokens a single abstraction removes
        domains = sorted({domain(l["name"]) for l in locations})
        clusters.append(
            {
                "instances": instances,
                "size_tokens": size,
                "size_lines": lines,
                "eliminated": eliminated,
                "cross_domain": len(domains) > 1,
                "domains": domains,
                "locations": sorted(
                    locations, key=lambda l: (l["name"], l["start"])
                ),
            }
        )

    clusters.sort(key=lambda c: (c["eliminated"], c["instances"]), reverse=True)

    print(f"# {len(clusters)} clone group(s) — ranked by tokens a single abstraction removes\n")
    for rank, c in enumerate(clusters, 1):
        scope = (
            f"CROSS-DOMAIN → {', '.join(c['domains'])} (abstraction must live in @shared)"
            if c["cross_domain"]
            else f"intra-domain ({c['domains'][0]})"
        )
        print(
            f"## #{rank}  {c['instances']}x  ~{c['size_lines']} lines / {c['size_tokens']} tokens each"
            f"  ·  ~{c['eliminated']} tokens removable  ·  {scope}"
        )
        for l in c["locations"]:
            print(f"    - {l['name']}:{l['start']}-{l['end']}")
        print()


if __name__ == "__main__":
    main()
