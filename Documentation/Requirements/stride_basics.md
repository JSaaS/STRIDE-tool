## STRIDE – The Basics

### Purpose

This document provides a practical introduction to STRIDE as a method for identifying security threats in systems, solutions, and architecture.

STRIDE is commonly used in threat modeling to structure thinking around the types of attacks or misuse that can affect a system.

It is not a complete risk analysis in itself, but it is an excellent way to discover security gaps, particularly early in design or when reviewing existing architecture.

---

### What is STRIDE?

STRIDE is a mnemonic where each letter represents a type of threat:

- **S – Spoofing**
- **T – Tampering**
- **R – Repudiation**
- **I – Information Disclosure**
- **D – Denial of Service**
- **E – Elevation of Privilege**

The idea is to systematically review a system and ask:

- Can someone impersonate another user or service?
- Can someone modify data or flows without authorization?
- Can someone deny having performed an action?
- Can information leak?
- Can the service be disrupted or taken down?
- Can someone acquire more privileges than they should have?

---

### Why STRIDE is Useful

STRIDE helps a team think beyond just "are our passwords strong?" or "do we have encryption?".

The method works well when you want to:

- review an architecture
- analyze APIs and integrations
- walk through data flows
- understand whether hidden security debt exists
- identify gaps in existing controls

It is particularly effective in workshop format, as it provides a simple structure for discussion.

---

### The Six Threat Categories

### 1. Spoofing

#### What it means

Spoofing is when someone impersonates another user, service, component, or identity.

#### Typical examples

- an attacker uses stolen credentials
- a service trusts a call without properly verifying the sender
- an API accepts tokens or certificates without correct validation
- an internal system assumes that traffic from the internal network is always legitimate

#### Questions to ask

- How are users and systems verified?
- Can a client, service, or integration impersonate someone else?
- Are we trusting network location instead of strong identity?
- How are secrets, tokens, keys, and certificates protected?

#### Common controls

- strong authentication
- correct token and certificate validation
- secret management in secure vaults
- short-lived tokens and rotation routines
- mutual TLS or other strong machine identity where needed

---

### 2. Tampering

#### What it means

Tampering means that data, messages, files, configuration, or code is modified in an unauthorized way.

#### Typical examples

- someone manipulates an API call or payload
- messages in an integration chain are altered in transit
- configuration files are changed without oversight
- logs or audit trails are manipulated

#### Questions to ask

- Can data be modified without authorization in transit or at rest?
- How do we know that a message or file is unchanged?
- How are configuration, code, and deployments protected?
- Is there sufficient validation of incoming data?

#### Common controls

- signing, checksums, or other integrity controls
- encryption in transit
- strict input validation
- protected deployments and change controls
- immutable logs or strongly controlled log access

---

### 3. Repudiation

#### What it means

Repudiation means that a user or actor can deny having performed an action, and the system lacks sufficient evidence to prove otherwise.

#### Typical examples

- an administrator makes a change without any trace
- a business-critical decision is made in the system but it is impossible to see by whom
- logging is missing or too weak to be used in incident investigations

#### Questions to ask

- Can we prove after the fact who did what?
- Are critical events logged in a reliable way?
- Do we have traceability for administrative actions?
- Can logs be manipulated or deleted?

#### Common controls

- clear audit trails
- centralized and protected logging
- timestamps and identity linkage to actions
- separation between the actor and the reviewer

---

### 4. Information Disclosure

#### What it means

Information Disclosure is when information is exposed to someone who should not have access to it.

#### Typical examples

- personal data leaks through API responses or logs
- incorrect permissions allow users to see too much
- test environments contain copies of production data
- data backups, files, or messages are stored without protection

#### Questions to ask

- What information here is sensitive?
- Can someone see data they should not see?
- Are we leaking information through logs, error messages, or integrations?
- Is data encrypted where needed?
- Do we have control over exports, backups, and test data?

#### Common controls

- access control and data minimization
- encryption at rest and in transit
- masking or anonymization of test data
- review of logs, error messages, and API responses
- data classification and clear handling rules

---

### 5. Denial of Service

#### What it means

Denial of Service means that a system, service, or flow is overloaded or made unavailable.

#### Typical examples

- an API lacks traffic rate limiting
- an integration component can be blocked by a small number of expensive calls
- an external dependency chain causes the entire solution to stop
- a malformed message creates queue buildup or resource locking

#### Questions to ask

- What happens if someone sends too many requests or large payloads?
- Is there protection against overload?
- Can one subsystem take down the entire chain?
- How does the solution recover from failures or peak load?

#### Common controls

- rate limiting and throttling
- queues, buffers, and circuit breakers
- isolation between critical components
- timeout handling and backoff strategies
- monitoring and autoscaling where appropriate

---

### 6. Elevation of Privilege

#### What it means

Elevation of Privilege means that someone gains higher permissions than they should have.

#### Typical examples

- a regular user can reach admin functions
- a service has broader permissions than necessary
- a system account is used for multiple purposes and becomes too powerful
- a combination of weaknesses allows an attacker to escalate from low to high privilege

#### Questions to ask

- Can someone escalate their privileges?
- Are roles and permissions sufficiently scoped?
- Are administrative functions too easily accessible?
- Do services, integrations, or pipelines have more privileges than they need?

#### Common controls

- least privilege
- role-based or attribute-based access control
- separation of administrative functions
- hardening of service identities and pipelines
- regular permission reviews

---

### How STRIDE is Used in Practice

A common approach is to start with a simple architecture diagram or data flow and then analyze each component and each transition.

Examples:

- client
- web app or frontend
- API
- integration layer
- database
- external systems
- message queues and batch flows

For each part, ask:

- which STRIDE threats are relevant here?
- what controls already exist?
- what gaps or uncertainties are there?
- which threats are realistic and serious?

The important thing is not to force all six categories everywhere, but to use them to think in a structured way.

---

### Simple Workshop Model

#### Step 1: Sketch the solution simply

Describe the main components, data flows, external dependencies, and trust boundaries.

#### Step 2: Walk through component by component

Ask which STRIDE threats are plausible for each part.

#### Step 3: Document controls and gaps

Note both existing controls and known weaknesses.

#### Step 4: Prioritize

Not all threats are equally important. Assess likelihood, impact, and exposure.

#### Step 5: Translate into actions

The outcome should ideally result in concrete improvements, not just a list of threats.

---

### Example: Simple Analysis of an API

Assume an API that receives calls from external clients and saves data to a database.

#### Possible STRIDE questions

**Spoofing**

- How does the API know that the client is really who it claims to be?

**Tampering**

- Can request data be manipulated without being detected?

**Repudiation**

- Can we see after the fact who sent which request?

**Information Disclosure**

- Does the API risk exposing too much data in responses or error messages?

**Denial of Service**

- What happens if the client sends an extremely high number of requests?

**Elevation of Privilege**

- Can a low-privilege user reach functions that require higher privileges?

This makes STRIDE concrete and easy to use even in relatively short reviews.

---

### What STRIDE Does Not Replace

STRIDE is useful, but it does not replace:

- risk assessment of business consequences
- security requirements and architecture principles
- penetration testing and technical verification
- vulnerability scanning and patch management
- legal and regulatory assessments

Think of it as a way to identify and structure threats, not as the entirety of security work.

---

### Signs That STRIDE Work is Working

Good STRIDE work often leads the team to:

- discover assumptions previously taken for granted
- find interfaces where trust has been too high
- surface old security debt
- gain a better shared understanding of what actually needs to be addressed

---

### Brief Summary

STRIDE helps you think about six fundamental threat types:

- **Spoofing** – false identity
- **Tampering** – unauthorized modification
- **Repudiation** – lack of traceability
- **Information Disclosure** – information leakage
- **Denial of Service** – unavailability
- **Elevation of Privilege** – unauthorized privilege escalation

As a working model, STRIDE is simple but powerful. It is particularly well suited when you want to understand whether a solution has only minor weaknesses — or whether there is real security debt that should be addressed now.

Gather the analysis per component and data flow. Plot which types of STRIDE threats apply. Utilize DREAD:

**D**amage  
**R**eproducibility  
**A**ffected users  
**E**xploitability  
**D**iscoverability

Each element of DREAD is scored 1–10, then summed, and a threshold is set. Above the threshold = more critical to fix.

1. **Draw a data flow diagram (DFD)** of the system — identify components, data flows, trust boundaries, and external actors.
2. **Walk through each element** in the diagram and ask: which STRIDE threats are relevant here?
3. **Document each identified threat** with: description, attacker's goal, and potential impact.
4. **Prioritize the threats** based on risk (likelihood × impact). DREAD or CVSS can be used.
5. **Define mitigations** for each threat and add them to the backlog with clear prioritization.