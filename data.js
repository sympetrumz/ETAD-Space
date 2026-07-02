/* =============================================================
   ETAD Delivery Command — DEFAULT SEED DATA
   -------------------------------------------------------------
   This file holds the *starting* content only. Once the page is
   opened, all live data (your edits, added/removed tasks, weights,
   completion, and weekly focus) is saved in your browser.
   Use the "Reset" button in the toolbar to wipe and reseed from
   this file again.

   Task shorthand:
     "Some text"                       -> open task,  weight 1
     { t:"Some text", done:true }      -> completed,  weight 1
     { t:"Some text", w:3 }            -> open task,  weight 3
   ============================================================= */
window.ETAD_DEFAULTS = {
  meta: {
    org: "ETAD",
    title: "Delivery Command",
    subtitle: "ETx 2026 — what needs to get done",
    updated: "Updated 10 April 2026",
    kpis: [
      { n: "\u22655",   l: "Use case facilitations" },
      { n: "100%",      l: "Readiness assessment" },
      { n: "\u226560%", l: "Staff exposure" },
      { n: "1",         l: "Single front door" }
    ],
    glossary: "SFD = single front door · UCF = use case facilitations · RA = readiness assessment · EXP = staff exposure"
  },

  /* Seeded into the CURRENT week the first time the page is opened. */
  focusSeed: [
    "Microsite go-live preparation \u2192 target Week 4",
    "Robot PoC memo \u2192 submit to Finance",
    "GASAD handover \u2192 formal sign-off with UD",
    "MID benchmarking \u2192 present to UD",
    "MMU AIX Lab TC meeting",
    "ETx Communications Plan \u2192 begin drafting"
  ],

  sections: [
    /* ---------------- A. PROGRAMME ENABLERS ---------------- */
    {
      eyebrow: "A", title: "Programme enablers", layout: "cards",
      cards: [
        {
          name: "ETx Blueprint 2026", icon: "B", accent: "crit", kpis: ["RA"],
          desc: "CTIO endorsement needed to formalise all KPIs. MCM tabling by end-April.",
          deadline: "End of April 2026",
          meta: [
            { label: "Owner",  value: "Muhammad Athari Ismail" },
            { label: "Target", value: "CTIO endorsement \u2192 MCM tabling by end-April" }
          ],
          groups: [{ label: "Action items", tasks: [
            { t: "Updated based on CTIO feedback from 2 Apr syndication", done: true },
            { t: "Document ready for next round of syndication", done: true },
            "Proceed with next round of CTIO syndication to secure endorsement",
            "Register for MCM tabling upon clearance",
            "Continue parallel operationalisation of all planned initiatives",
            "Keep all initiatives moving \u2014 don't slow down while waiting for tabling"
          ]}]
        },
        {
          name: "AWP 2026 KPI Dictionary", icon: "K", accent: "done",
          desc: "Submitted to SPD on 8 Apr. Awaiting acknowledgement.",
          meta: [
            { label: "PIC",     value: "Mohd Amir Syafiq Ab Halim" },
            { label: "Support", value: "Wong Xin Jian" }
          ],
          groups: [{ label: "Action items", tasks: [
            { t: "Draft dictionary completed", done: true },
            { t: "Submitted to SPD on 8 April 2026", done: true },
            "Await SPD acknowledgement and clarification requests",
            "Address feedback if required"
          ]}]
        },
        {
          name: "ETx Communications Plan", icon: "C", accent: "new",
          desc: "Comms and marketing strategy for all ETx 2026 initiatives.",
          meta: [
            { label: "PIC",     value: "Mohd Amir Syafiq Ab Halim" },
            { label: "Support", value: "Nur Syahirah Ja'afar / Asvinitha Muniandy" }
          ],
          groups: [{ label: "Action items", tasks: [
            "Develop comprehensive communications plan covering all ETx 2026 initiatives",
            "Define key messaging and narrative for each initiative",
            "Map target audience segments (internal divisions, senior management, external)",
            "Develop phased rollout communications calendar aligned with launch dates",
            "Draft quick-win internal marketing materials (emails, Teams posts, intranet banners)",
            "Prepare management briefing deck for Dr Karl to syndicate ETAD visibility",
            "Coordinate with Brand Comms on visual identity and channel alignment",
            "Submit communications plan for Director review and endorsement"
          ]}],
          note: "Serves as the marketing strategy to build awareness and momentum before and during each initiative launch."
        }
      ]
    },

    /* ---------------- B. DELIVERY INITIATIVES ---------------- */
    {
      eyebrow: "B", title: "Delivery initiatives", layout: "phases",
      phases: [
        {
          title: "Critical path", when: "Immediate action \u00b7 April Week 2\u20134", accent: "crit",
          cards: [
            {
              name: "ETx Microsite", icon: "M", accent: "crit", kpis: ["SFD"],
              desc: "Single Front Door. Go-live unlocks IN-PROMPT-TO-U.",
              deadline: "Week 4 April 2026",
              meta: [
                { label: "Lead",    value: "Wong Xin Jian" },
                { label: "PIC",     value: "Asvinitha Muniandy / Noor Aisyah Hanum" },
                { label: "Support", value: "Nur Syahirah / Syafiq Haikal" }
              ],
              groups: [{ label: "Action items", tasks: [
                { t: "First draft completed (content structure + Brand Comms coordination)", done: true },
                { t: "Deployment approach discussed with ITD", done: true },
                "Finalise UI/UX design and branding alignment with Corp Comms",
                "Complete content development (initiative pages, programme info, use cases)",
                "Submit for ITD technical clearance and hosting approval",
                "Obtain internal review sign-off before go-live",
                "Prepare announcement email for internal comms",
                "Go live \u2014 target Week 4 April"
              ]}],
              note: "The unlock \u2014 IN-PROMPT-TO-U cannot launch until Microsite is live. Prioritise above all else."
            },
            {
              name: "Robot lobby PoC", icon: "R", accent: "crit", kpis: ["UCF"],
              desc: "Revised memo to Finance by mid-April. All 3 stakeholders consulted.",
              deadline: "Mid-April 2026",
              meta: [
                { label: "Lead",    value: "Muhammad Amirullah Hamzah" },
                { label: "PIC",     value: "Nur Syahirah Ja'afar" },
                { label: "Support", value: "Noor Aisyah Hanum" }
              ],
              groups: [{ label: "Action items", tasks: [
                { t: "Consulted all 3 internal stakeholders (Finance, Procurement, FAMD)", done: true },
                { t: "FAMD site visit conducted (7 Apr) \u2014 findings being consolidated", done: true },
                "Finalise revised Budget Virement Memo with updated vendor quotations",
                "Submit updated memo to Finance Division",
                "Raise RFI via myProc",
                "Arrange management briefing for PoC endorsement",
                "Upon Finance clearance \u2014 proceed procurement execution",
                "Confirm PoC deployment schedule with selected vendor",
                "Consolidate FAMD site visit findings (space + logistics)"
              ]}]
            }
          ]
        },
        {
          title: "Launch phase", when: "Triggered once Microsite is live \u00b7 Week 3\u20134 April", accent: "high",
          cards: [
            {
              name: "IN-PROMPT-TO-U \u2014 PROMPT\u00b7to\u00b7VISUAL", icon: "P", accent: "high", kpis: ["EXP"], wide: true,
              desc: "Flagship staff exposure programme. First clinic. Blocked until Microsite is live.",
              deadline: "April 2026 (post-Microsite go-live)",
              meta: [
                { label: "Lead",    value: "Nur Syahirah Ja'afar" },
                { label: "PIC",     value: "Asvinitha Muniandy" },
                { label: "Support", value: "Everyone (full team)" }
              ],
              groups: [{ label: "Action items", tasks: [
                "Finalise memo to MCMC Academy for programme registration and clearance",
                "Conduct meeting with MCMC Academy to discuss collaboration",
                "Confirm enrollment mechanism (Microsite / Academy / email)",
                "Prepare participant announcement \u2014 draft ready once Microsite is live",
                "Confirm venue, date and logistics for first clinic",
                "Open enrollment once Microsite is live",
                "Run inaugural PROMPT\u00b7to\u00b7VISUAL clinic"
              ]}],
              note: "Blocked by: ETx Microsite go-live + Academy memo approval. Next modules: PROMPT\u00b7to\u00b7AGENT, PROMPT\u00b7to\u00b7MOTION."
            }
          ]
        },
        {
          title: "Q2\u2013Q3 runway", when: "Methodology now, distribution by Q3", accent: "new",
          cards: [
            {
              name: "ET Readiness & Exposure Assessment", icon: "7", accent: "new", kpis: ["RA", "EXP"], wide: true,
              desc: "Organisational baseline + individual staff exposure survey. Longer runway \u2014 no immediate lag risk.",
              deadline: "Q2 methodology; Q3 distribution",
              meta: [
                { label: "PIC",     value: "Mohd Amir Syafiq Ab Halim" },
                { label: "Support", value: "Wong Xin Jian" }
              ],
              groups: [
                { label: "(i) ET readiness assessment \u2014 organisational", tasks: [
                  "Complete internal review of measurement methodology",
                  "Cross-validate approach with Statistics Department",
                  "Distribute assessment \u2014 target end Q3 2026"
                ]},
                { label: "(ii) ET exposure survey \u2014 individual", tasks: [
                  "Finalise survey instrument and distribution mechanism",
                  "Finalise questionnaire",
                  "Distribute survey \u2014 target end Q3 2026"
                ]}
              ]
            }
          ]
        }
      ]
    },

    /* ---------------- C. INTERNAL UCF ---------------- */
    {
      eyebrow: "C", title: "Use case facilitations \u2014 internal", layout: "cards",
      cards: [
        {
          name: "GASAD", icon: "G", accent: "high", kpis: ["UCF"],
          desc: "HLD signed off. Final testing concluding. Handover by mid-April.",
          meta: [
            { label: "PIC",     value: "Muhammad Amirullah Hamzah" },
            { label: "Support", value: "Syafiq Haikal Syaidali" }
          ],
          groups: [{ label: "Action items", tasks: [
            { t: "HLD documentation completed and signed off", done: true },
            { t: "Development enhancements based on feedback completed", done: true },
            { t: "Final testing in concluding phase", done: true },
            "Arrange meeting with UD for formal sign-off and handover"
          ]}]
        },
        {
          name: "PSDD AI chatbot", icon: "P", accent: "prog", kpis: ["UCF"],
          desc: "Testing phase. Awaiting UD feedback for enhancement.",
          meta: [
            { label: "PIC",     value: "Syafiq Haikal Syaidali" },
            { label: "Support", value: "Noor Aisyah Hanum" }
          ],
          groups: [{ label: "Action items", tasks: [
            { t: "AI chatbot integrated in PSDD environment", done: true },
            { t: "Synced to knowledge sources", done: true },
            "Obtain structured feedback from UD (expected next week)",
            "Proceed with agent enhancement under defined timeline"
          ]}]
        },
        {
          name: "FAMD Experience Centre", icon: "E", accent: "prog", kpis: ["UCF"],
          desc: "Site visit done 7 Apr. Scope alignment ongoing.",
          meta: [],
          groups: [{ label: "Action items", tasks: [
            { t: "Site visit conducted on 7 Apr 2026", done: true },
            "Consolidate findings on spatial requirements",
            "Align with FAMD on Robot PoC and ET integration scope"
          ]}]
        },
        {
          name: "MID / Bilby platform", icon: "B", accent: "prog", kpis: ["UCF"],
          desc: "Kick-off done 7 Apr. Benchmarking in development.",
          deadline: "Benchmarking by 13 Apr",
          meta: [
            { label: "PIC",     value: "Muhammad Amirullah Hamzah" },
            { label: "Support", value: "Noor Aisyah Hanum" }
          ],
          groups: [{ label: "Action items", tasks: [
            { t: "Kick-off meeting convened on 7 Apr 2026", done: true },
            "Document scope and use case requirements",
            "Develop benchmarking procedure (Bilby Pulse, Global Data, ChatGPT, Gemini, Copilot)",
            "Present preliminary assessment to UD"
          ]}]
        }
      ]
    },

    /* ---------------- D. EXTERNAL UCF ---------------- */
    {
      eyebrow: "D", title: "Use case facilitations \u2014 external", layout: "cards",
      cards: [
        {
          name: "MCMC \u00d7 MMU (AIX Lab)", icon: "A", accent: "prog", kpis: ["UCF"],
          desc: "BOQ signed off. TC meeting 14 Apr.",
          meta: [
            { label: "PIC",   value: "Muhammad Athari Ismail" },
            { label: "Role",  value: "Technical Committee Lead" },
            { label: "Scope", value: "13 AIX Labs, RM31.51M / 5 years" }
          ],
          groups: [{ label: "Action items", tasks: [
            { t: "BOQ formally signed off with governance caveats", done: true },
            { t: "Technical evaluation on 7 emerging technology labs completed", done: true },
            "Attend divisional TC meeting on 14 Apr; monitor caveats in procurement specs"
          ]}]
        },
        {
          name: "MCMC \u00d7 MOT (AV)", icon: "V", accent: "prog", kpis: ["UCF"],
          desc: "Kick-off done 1 Apr. Report to StratGov pending.",
          meta: [{ label: "PIC", value: "Muhammad Amirullah Hamzah" }],
          groups: [{ label: "Action items", tasks: [
            { t: "First kick-off attended on 1 Apr at Rekascape", done: true },
            "Submit FGD report to StratGov; continue roadmap contribution"
          ]}]
        },
        {
          name: "MCMC \u00d7 MD (RUU AI)", icon: "L", accent: "prog", kpis: ["UCF"],
          desc: "Meeting held 6 Apr. Work scoping ongoing.",
          meta: [
            { label: "PIC",   value: "Mohd Amir Syafiq Ab Halim" },
            { label: "Focus", value: "AI Governance Bill (RUU AI)" }
          ],
          groups: [{ label: "Action items", tasks: [
            { t: "Meeting convened 6 Apr at Menara PJH", done: true },
            "Continue advisory support on work scoping deliverables"
          ]}]
        },
        {
          name: "MCMC \u00d7 JSM/MITI", icon: "F", accent: "prog", kpis: ["UCF"],
          desc: "Kick-off 9 Apr at PICC. Key gaps identified.",
          meta: [
            { label: "PIC",   value: "Nur Syahirah Ja'afar" },
            { label: "Focus", value: "AI Governance, Cybersecurity, Semiconductor, Digital Trade" }
          ],
          groups: [{ label: "Action items", tasks: [
            { t: "Kick-off held 9 Apr; cross-agency gaps and governance constraints identified", done: true },
            "Consolidate MCMC position and align follow-up actions with JSM/MITI"
          ]}]
        }
      ]
    },

    /* ---------------- TBR ---------------- */
    {
      eyebrow: "\u23f8", title: "To be reassessed (TBR)", layout: "phases",
      phases: [
        {
          title: "Dormant", when: "Dormant >1 month \u2014 no official request", accent: "tbr",
          cards: [
            {
              name: "MCMC \u00d7 KWP (Elderly alert system)", accent: "tbr", tbr: true,
              desc: "Ready since mid-March. No formal call for collaboration received.",
              meta: [
                { label: "Status", value: "Syndication material ready (chronology, assessment, next actions)" },
                { label: "Issue",  value: "No official request. Not initiated through formal channels." }
              ],
              groups: [],
              note: "Recommendation: withdraw from weekly update unless direction is received from Director."
            },
            {
              name: "MCMC \u00d7 MD (Kota MADANI)", accent: "tbr", tbr: true,
              desc: "Ready since mid-March. No formal call for collaboration received.",
              meta: [
                { label: "Status", value: "Stakeholder mapping and syndication planning ready" },
                { label: "Issue",  value: "No official request. Pending role delineation." }
              ],
              groups: [],
              note: "Recommendation: withdraw from weekly update unless direction is received from Director."
            }
          ]
        }
      ]
    }
  ],

  quarterly: [
    { tag: "Q1 done",   pct: 25, tone: "q1", note: "Groundwork and pipeline initiation. Blueprint established. Governance set up." },
    { tag: "Q2 target", pct: 50, tone: "q2", note: "Microsite live. First clinic launched. Blueprint tabled. Assessment methodology finalised." },
    { tag: "Q3 target", pct: 75, tone: "q3", note: "Scaled clinics. Active use case delivery. Assessment distributed. Survey conducted." }
  ]
};
