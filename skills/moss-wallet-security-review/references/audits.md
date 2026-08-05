# Security Review Records

MOSS's first-party documentation records the following Normal Account review
engagements and fixed/remediated commits:

| Reviewer | Review type | Fixed/remediated commit | Public artifact status |
| --- | --- | --- | --- |
| SlowMist | Manual security audit | `81478ee528782676424a7653d5a45ac8a0cc1165` | Report not bundled or publicly linked in this repository |
| BlockSec | Manual security audit | `50d9bbf56229c9e007c5104b4863e3bae646b395` | Report not bundled or publicly linked in this repository |
| Codex | Automated analysis | `092b67d5f0d53e541891454b327bc04599ad3293` | First-party docs say no formal report |

These rows document the first-party claim; they are not a substitute for the
reports themselves. Before making a public audit-coverage claim, obtain the
final reports from MegaETH Labs, confirm redistribution permission, and map the
reviewed commits to the currently deployed Normal Account implementation.

For an integration review, separately verify:

1. the account implementation and proxy/upgrade state used by the target
   network;
2. whether the deployed bytecode descends from a reviewed commit;
3. findings, severity, remediation status, and review scope in the final
   reports;
4. changes made after each reviewed commit.

Absence of a public report link does not show that an engagement did not occur;
it means the underlying report and its scope were not independently verifiable
from the public release materials during this audit.
