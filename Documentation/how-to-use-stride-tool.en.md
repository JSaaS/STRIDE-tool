# How to Use the STRIDE Tool

This guide explains how to use the STRIDE tool in simple terms. It is written for people who are new to threat modeling.

## What the Tool Is For

The tool helps you look at a system and ask:

> What could go wrong, how bad would it be, and what should we do about it?

You draw the important parts of your system, add the flows between them, and then document possible security threats using STRIDE. You score each threat with DREAD so the team can see what needs attention first.

## ELI5: What Is STRIDE?

Imagine your system is a house.

STRIDE is a checklist for thinking about bad things that could happen to the house:

- **S - Spoofing:** someone pretends to be someone else.
- **T - Tampering:** someone changes something they should not change.
- **R - Repudiation:** someone does something bad and says "it was not me".
- **I - Information Disclosure:** someone sees secrets they should not see.
- **D - Denial of Service:** someone makes the system stop working.
- **E - Elevation of Privilege:** someone gets more power than they should have.

You do not need to find every possible problem in the universe. The goal is to think clearly and catch the important ones.

## ELI5: What Is DREAD?

DREAD is a simple way to score how serious a threat is.

Each threat gets five scores from 1 to 10:

- **Damage:** how bad is the impact?
- **Reproducibility:** how easy is it to repeat the attack?
- **Affected users:** how many users, systems, or data records are affected?
- **Exploitability:** how easy is it to exploit?
- **Discoverability:** how easy is it for an attacker to find?

The tool adds them together. The total score is between 0 and 50.

A higher score means the threat needs more attention. The default threshold is 25. Threats at or above the threshold are shown as critical.

## Before You Start

You need a basic picture of the system:

- main applications or services
- APIs
- databases
- external systems
- users or clients
- important data flows
- trust boundaries, such as internet, DMZ, internal network, cloud subscription, or third-party system

Do not try to make the diagram perfect. Start simple and improve it as you learn.

## Step 1: Open the Tool

Open `index.html` in a browser.

The tool runs locally in the browser. There is no server, no build step, and no login.

## Step 2: Name the Analysis

Use the name field at the top to give the analysis a clear name, for example:

- `Customer Portal STRIDE`
- `Order API Threat Model`
- `Integration Platform Review`

This name will also be used in exports and reports.

## Step 3: Add Trust Boundaries

A trust boundary is a line between areas with different levels of trust.

Examples:

- browser to backend
- internet to internal network
- application to database
- your system to a third-party provider
- one cloud subscription to another

Use **+ Boundary** to add one.

Drag the boundary header to move it. Use the resize handle in the lower-right corner to resize it.

## Step 4: Add Components

A component is an important part of the system.

Examples:

- web frontend
- mobile app
- API
- database
- message queue
- identity provider
- external payment service
- batch job

Use **+ Component** to add one. If the component belongs inside a trust boundary, choose that boundary when creating it.

Drag components around the canvas to make the model readable.

## Step 5: Add Flows

A flow is information moving from one component to another.

Examples:

- browser sends login request to API
- API reads customer data from database
- order service publishes message to queue
- integration service calls external ERP system

To add a flow:

1. Click the flow button.
2. Click the source component.
3. Click the target component.
4. Give the flow a short name if useful.

Flows are important because many real threats happen between components, especially when data crosses a trust boundary.

## Step 6: Analyze a Component

Click a component. The analysis panel opens on the right.

You will see six STRIDE cards:

- S - Spoofing
- T - Tampering
- R - Repudiation
- I - Information Disclosure
- D - Denial of Service
- E - Elevation of Privilege

Click a category when you find a relevant threat.

For each threat, write:

- **How is the attack possible?** Describe the attack path.
- **Existing controls:** What already protects against it?
- **Gaps:** What is missing or weak?
- **DREAD score:** Score the threat from 1 to 10 in each DREAD dimension.

Good threat descriptions are specific:

- Good: `A stolen bearer token can be reused because token audience is not validated.`
- Weak: `Authentication problem.`

## Step 7: Score with DREAD

Use DREAD to make prioritization easier.

A practical scoring rule:

- **1-3:** low
- **4-6:** medium
- **7-10:** high

Do not spend too much time arguing about exact numbers. The goal is to separate minor issues from serious ones.

Useful questions:

- Would this expose sensitive data?
- Can an attacker repeat it easily?
- Would many users or systems be affected?
- Is exploitation simple or automated?
- Would an attacker naturally discover this path?

## Step 8: Use the Threshold

The threshold is the score where the tool marks a threat as critical.

Default: `25`

If a threat score is at or above the threshold, the component is highlighted more strongly.

Use the threshold as a prioritization aid, not as a hard truth. A score of 24 can still matter.

## Step 9: Export the Report

Use **Export report** when you want a readable report.

The report includes:

- number of components
- number of flows
- number of documented threats
- number of critical threats
- flow list
- STRIDE findings
- DREAD scores
- existing controls and gaps

Use the report as a discussion artifact with architects, developers, security reviewers, product owners, and system owners.

## Suggested Workshop Flow

1. Draw the system at a high level.
2. Add trust boundaries.
3. Add the most important data flows.
4. Pick one component at a time.
5. Walk through S, T, R, I, D, and E.
6. Document realistic threats.
7. Score with DREAD.
8. Review the highest scores.
9. Turn the most important gaps into actions.

## What Makes a Good Threat?

A good threat is concrete enough that someone can act on it.

Good:

- `Unsigned webhook payloads can be modified before reaching the order API.`
- `Admin API accepts tokens without checking required role.`
- `Error responses may expose customer identifiers and backend details.`

Too vague:

- `Security issue`
- `API can be hacked`
- `Need better auth`

Use this rule:

> If two attack paths would have different controls, gaps, or DREAD scores, write them as separate threats.

## Common Mistakes

- Drawing too much detail before starting the analysis.
- Treating STRIDE as a checklist that must produce one threat in every category.
- Writing vague threats that cannot be fixed.
- Scoring everything as high.
- Forgetting data flows and only analyzing boxes.
- Treating a low DREAD score as proof that no action is needed.

## Quick Example

System:

- browser
- web app
- API
- database

Flow:

- browser sends login request to API

Possible STRIDE findings:

- **Spoofing:** stolen token can be reused.
- **Tampering:** request payload can be modified if validation is weak.
- **Repudiation:** login attempts are not logged with enough detail.
- **Information Disclosure:** error messages reveal whether an email exists.
- **Denial of Service:** login endpoint has no rate limit.
- **Elevation of Privilege:** role checks are done only in the frontend.

Each of these should be documented and scored separately if it is relevant.

## Final Advice

Keep the model useful, not perfect. A small model with clear threats and real actions is better than a beautiful diagram with vague findings.
