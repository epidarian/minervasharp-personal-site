// Combined content from both resumes (Senior Software Engineer + DevSecOps).
// No phone number, no visible email address: contact is LinkedIn + the form.

export type Track = "software" | "platform" | "security";

export interface Bullet {
  text: string;
  tags: Track[];
}

export interface Role {
  title: string;
  org: string;
  location: string;
  period: string;
  note?: string;
  bullets: Bullet[];
}

export interface SkillGroup {
  label: string;
  items: string[];
}

export interface Project {
  name: string;
  blurb: string;
  href?: string;
}

export interface SchoolEntry {
  credential: string;
  school: string;
  detail: string;
}

export interface EarlyRole {
  title: string;
  org: string;
  period: string;
}

export const identity = {
  name: "Minerva Sharp",
  nameMark: "Minerva Sharp_",
  title: "Senior Software and Platform Engineer",
  location: "San Diego, California",
  linkedin: "https://www.linkedin.com/in/minerva-sharp",
};

export const summary = [
  "I solve problems. Most of my work is keeping software online: microservices, cloud infrastructure, and security. I also make beautiful web pages in React and TypeScript.",
  "I started my career in tech support and IT, and transitioned into DevOps and then software engineering. Security has been part of my work since I began working with the Department of Defense: hardening systems, automating compliance, and turning security requirements into engineering tasks.",
];

export const devopsSince = 2010;

export const likes = [
  "leading teams",
  "working with other teams",
  "iced coffee",
  "baking",
  "books",
  "makery",
  "sweet",
  "hands-on",
];

export const passes = [
  "confrontation",
  "stolen work",
  "hot beverages",
  "horror games",
  "pig-headishness",
  "bitter",
  "loud noises",
];

// Union of the SE "Technical Skills" and DO "Core Competencies" lists.
export const skillGroups: SkillGroup[] = [
  {
    label: "Languages",
    items: [
      "Go (primary)",
      "TypeScript",
      "Python",
      "Bash",
      "PowerShell",
      "SQL / T-SQL",
      "Ruby",
      "Java",
      "C++",
      "C#",
      "PHP",
    ],
  },
  {
    label: "Frontend",
    items: ["React", "TypeScript", "Single-page web applications"],
  },
  {
    label: "Backend & Data",
    items: [
      "REST APIs",
      "Microservices",
      "PostgreSQL schema design",
      "SQL Server",
      "Redis",
      "Kafka",
      "Data pipelines",
    ],
  },
  {
    label: "Cloud & Runtime",
    items: [
      "AWS (EKS, ElastiCache)",
      "Azure",
      "GCP",
      "Kubernetes",
      "OpenShift",
      "Rancher",
      "Teleport",
      "Docker",
    ],
  },
  {
    label: "Infrastructure as Code",
    items: ["Terraform", "OpenTofu", "Ansible", "Chef"],
  },
  {
    label: "Observability",
    items: [
      "Datadog",
      "Prometheus",
      "Grafana",
      "Splunk",
      "Elastic Stack",
    ],
  },
  {
    label: "Security & Compliance",
    items: [
      "Secure-by-default design",
      "MITRE ATT&CK threat modeling",
      "Privileged access management",
      "FedRAMP",
      "DoD ATO",
      "STIG automation",
      "CIS benchmarks",
      "Common Criteria",
      "Penetration testing",
      "HIPAA",
    ],
  },
  {
    label: "CI/CD & Delivery",
    items: [
      "Jenkins",
      "Git",
      "CI/CD pipelines",
      "Sonatype Nexus",
      "JFrog Artifactory",
    ],
  },
  {
    label: "Practice",
    items: [
      "System design",
      "Technical design docs",
      "Unit & integration testing",
      "Code review",
      "Incident response",
    ],
  },
];

// Bullets merged and de-duplicated across both PDFs, tagged by track.
export const roles: Role[] = [
  {
    title: "Senior Software Engineer",
    org: "VeraSec Technologies",
    location: "Remote",
    period: "Jun 2025 – Present",
    note: "consultant Jun 2025 – Sep 2026, full time since Oct 2026",
    bullets: [
      {
        text: "Build full-stack features end to end on a hybrid Go platform joined by a command API, from backend services to the frontend.",
        tags: ["software"],
      },
      {
        text: "Own architecture and detailed design documents, then ship performant, production-ready code against them.",
        tags: ["software"],
      },
      {
        text: "Work directly with stakeholders to gather requirements, scope features, and turn feedback into delivery plans.",
        tags: ["software"],
      },
      {
        text: "Maintain quality across the stack with unit and integration testing; lead release demos for stakeholder review.",
        tags: ["software"],
      },
    ],
  },
  {
    title: "Senior Software Engineer, Platform & Security",
    org: "Art of Problem Solving",
    location: "San Diego, CA",
    period: "Jun 2024 – Sep 2026",
    note: "title held: Senior DevOps Engineer, Head of SecOps",
    bullets: [
      {
        text: "Built internal security and developer-workflow tooling in Go used across engineering for an education platform serving nearly one million students.",
        tags: ["software", "security"],
      },
      {
        text: "Designed the PostgreSQL data model and added a Redis (ElastiCache) caching layer for a production platform held to a 99.999% uptime target.",
        tags: ["software", "platform"],
      },
      {
        text: "Instrumented the platform end to end with Datadog, giving product teams service-level visibility into performance and errors.",
        tags: ["platform"],
      },
      {
        text: "Partnered with product teams on build and deployment pipelines and containerized services across EKS, Rancher, Spyglass, and Teleport, all managed as code.",
        tags: ["platform"],
      },
      {
        text: "Directed security operations for the platform as Head of SecOps.",
        tags: ["security"],
      },
    ],
  },
  {
    title: "Senior Development Consultant (Software Lead)",
    org: "SteelCloud LLC",
    location: "San Diego, CA",
    period: "Feb 2024 – Jun 2024",
    bullets: [
      {
        text: "Led 15 engineers building compliance and integration software that carried DoD clients through Authority to Operate (ATO).",
        tags: ["software", "security"],
      },
      {
        text: "Wrote Go tooling, Ruby on Rails services, and T-SQL database code; built C# build pipelines and ran Jenkins CI/CD on Azure.",
        tags: ["software", "platform"],
      },
      {
        text: "Drove STIG automation and Common Criteria certification end to end, validating shipped products through penetration testing and security review.",
        tags: ["security"],
      },
      {
        text: "Authored ATO doctrine and compliance paperwork inside FedRAMP boundaries, mapped controls to MITRE ATT&CK, and converted security-officer requirements into engineering tasks.",
        tags: ["security"],
      },
    ],
  },
  {
    title: "Senior Software Engineer, DevSecOps",
    org: "Forward Slope, Inc.",
    location: "San Diego, CA",
    period: "Jun 2022 – Feb 2024",
    bullets: [
      {
        text: "Led a three-engineer team building logistics endpoint applications and FedRAMP-compliant cloud services for the primary client.",
        tags: ["software", "security"],
      },
      {
        text: "Built a T-SQL-to-Kafka connector that streamed the client's legacy data into a modern event pipeline, unblocking modernization.",
        tags: ["software", "platform"],
      },
      {
        text: "Built and operated AWS data-processing infrastructure on Kubernetes and OpenShift, with Jenkins CI/CD and Prometheus/Grafana monitoring.",
        tags: ["platform"],
      },
      {
        text: "Ran STIG automation and operated Splunk, Prometheus, and Grafana for security monitoring.",
        tags: ["security", "platform"],
      },
    ],
  },
  {
    title: "Senior DevSecOps Engineer",
    org: "Remediant, Inc.",
    location: "Remote",
    period: "Jul 2021 – Jan 2022",
    note: "acquired by Netwrix",
    bullets: [
      {
        text: "Wrote Python services and internal tooling for a privileged-access-management SaaS with strict uptime and attack-surface requirements.",
        tags: ["software", "security"],
      },
      {
        text: "Built the CI/CD and deployment path on Kubernetes (Rancher), managed via Terraform and Ansible; owned incident response.",
        tags: ["platform"],
      },
      {
        text: "Drove CIS benchmark hardening and compliant deployment; ran the Elastic Stack.",
        tags: ["security", "platform"],
      },
    ],
  },
  {
    title: "Senior DevSecOps Engineer",
    org: "Cubic Corporation",
    location: "Washington, D.C. Metro Area",
    period: "Dec 2019 – Jul 2021",
    bullets: [
      {
        text: "Wrote tooling in C++, Ruby, and Python supporting highly available software on air-gapped, rugged field servers.",
        tags: ["software", "platform"],
      },
      {
        text: "Designed and hand-built portable build-and-test rigs (ESXi host, router, and UPS on a mobile chassis) and shipped them to subcontractors for assembly.",
        tags: ["platform"],
      },
      {
        text: "Ran Jenkins CI/CD, Ansible and Chef, and Nexus and Artifactory; deployed Kubernetes for high-availability applications.",
        tags: ["platform"],
      },
      {
        text: "Deployed Splunk and mapped coverage to MITRE ATT&CK; ran QA and networking across the platform.",
        tags: ["security"],
      },
    ],
  },
  {
    title: "Chief Technology Officer",
    org: "LifeSoft LLC",
    location: "Remote",
    period: "Apr 2017 – May 2021",
    bullets: [
      {
        text: "Led a three-engineer team shipping three concurrent products: an iOS app for ophthalmologists, a clinical-analytics engine collating EMR data, and stocksweeper.net, a technical-signals tool for NYSE equities.",
        tags: ["software"],
      },
      {
        text: "Owned architecture, the PHP backend on Azure, iOS build infrastructure, and HIPAA-aligned hosting for the medical products.",
        tags: ["software", "platform", "security"],
      },
    ],
  },
  {
    title: "Cybersecurity Engineer",
    org: "SteelCloud LLC",
    location: "Washington, D.C. Metro Area",
    period: "May 2018 – Dec 2019",
    bullets: [
      {
        text: "Consulted on STIG and CIS hardening software and secure Kubernetes adoption; deployed VMs and containers for server and test environments.",
        tags: ["security", "platform"],
      },
      {
        text: "Coordinated Common Criteria, CDM, and APL licensing.",
        tags: ["security"],
      },
    ],
  },
];

export const projects: Project[] = [
  {
    name: "Marston Technologies",
    blurb:
      "Charitable initiative and independent development company that recruits neurodivergent software engineers and places them in roles suited to their strengths. Built its portfolio of React and TypeScript web applications.",
  },
  {
    name: "stocksweeper.net",
    blurb: "Technical-signals tool for NYSE equities.",
  },
];

export const education: SchoolEntry[] = [
  {
    credential: "M.S., Computer Science",
    school: "Southern New Hampshire University",
    detail: "expected 2030",
  },
  {
    credential: "B.S., Computer Science",
    school: "Southern New Hampshire University",
    detail: "expected 2027",
  },
  {
    credential: "A.S., Computer and Network Systems",
    school: "ITT Technical Institute, San Diego",
    detail: "2013",
  },
];

export const certifications: string[] = [
  "CompTIA Security+",
  "Certified Scrum Master",
  "Python Programming",
  "SQL Essential Training",
  "Learning Kubernetes",
  "Learning Data Analytics",
];

export const earlyCareer: EarlyRole[] = [
  {
    title: "Managed Services Consultant",
    org: "Agile IT, San Diego",
    period: "2017–2018",
  },
  {
    title: "Technical Support Specialist",
    org: "H&R Block, San Diego",
    period: "2016–2017",
  },
  { title: "DevOps Technician", org: "Jack in the Box, San Diego", period: "2012" },
  {
    title: "Technical Services",
    org: "Balboa City School, San Diego",
    period: "2007–2009",
  },
];

export const trackLabels: Record<Track, string> = {
  software: "Software",
  platform: "Platform",
  security: "Security",
};
