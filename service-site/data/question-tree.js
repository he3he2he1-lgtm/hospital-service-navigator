window.QUESTION_TREE = {
  title: "Is this related to discharge planning?",
  help: "",
  options: [
    {
      id: "hospital-flow",
      label: "Yes",
      rules: { needTags: ["post-acute"], context: "hospital" },
      next: {
        title: "What is the main barrier?",
        help: "",
        options: [
          {
            id: "home-supports",
            label: "Home supports",
            rules: { boostServices: ["Inner Melbourne Post Acute Care (IMPAC)", "Post-acute Care"], supportTags: ["case-management", "personal-care"] },
            next: {
              title: "What support is missing?",
              help: "",
              options: [
                { id: "new-need-28-days", label: "New post-discharge need", rules: { boostServices: ["Inner Melbourne Post Acute Care (IMPAC)"] } },
                { id: "basic-personal-care", label: "Personal care / cleaning", rules: { boostServices: ["Inner Melbourne Post Acute Care (IMPAC)", "Home and Community Care Program for Younger People"] } },
                { id: "nursing-home", label: "Nursing", rules: { boostServices: ["District Nursing"] } },
                { id: "carer-break", label: "Carer break", rules: { boostServices: ["Carer Gateway - respite"] } },
              ],
            },
          },
          {
            id: "below-baseline",
            label: "Rehab / below baseline",
            rules: { boostServices: ["Community Rehabilitation Centres", "Rehab at home", "Rehabilitation In The Home (RITH) - difference?"], supportTags: ["clinical"] },
            next: {
              title: "Where can rehab happen?",
              help: "",
              options: [
                { id: "admitted-home-rehab", label: "Admitted home rehab", rules: { boostServices: ["Rehab at home"] } },
                { id: "rith", label: "RITH", rules: { boostServices: ["Rehabilitation In The Home (RITH) - difference?"] } },
                { id: "crc", label: "Centre-based rehab", rules: { boostServices: ["Community Rehabilitation Centres"] } },
                { id: "young-complex-disability", label: "Young adult disability", rules: { boostServices: ["Young Adult Complex Disability Service"] } },
              ],
            },
          },
          {
            id: "acute-at-home",
            label: "Acute care at home",
            rules: { boostServices: ["Hospital in the Home", "The Cottage", "Cancer Care @ Home"], supportTags: ["clinical"] },
            next: {
              title: "Where is safe?",
              help: "",
              options: [
                { id: "hith-home", label: "Home", rules: { boostServices: ["Hospital in the Home"] } },
                { id: "hith-no-home", label: "No safe home", rules: { boostServices: ["The Cottage"] } },
                { id: "cancer-home", label: "Cancer care", rules: { boostServices: ["Cancer Care @ Home"] } },
              ],
            },
          },
          {
            id: "housing-blocks-discharge",
            label: "Housing",
            rules: { needTags: ["housing"], situationTags: ["homelessness"], context: "hospital" },
            next: {
              title: "Which housing issue?",
              help: "",
              options: [
                { id: "homeless-acute-care", label: "Acute care + no home", rules: { boostServices: ["The Cottage"] } },
                { id: "health-housing", label: "Health + housing", rules: { boostServices: ["BHHP Sumner House"] } },
                { id: "long-term-rough-sleeping", label: "Rough sleeping", rules: { boostServices: ["Elizabeth Street Common Ground"] } },
                { id: "young-homeless", label: "Young person", rules: { boostServices: ["Frontyard Youth Services"] } },
                { id: "crisis-tonight", label: "Crisis tonight", rules: { boostServices: ["Crisis and emergency accommodation"] } },
              ],
            },
          },
          {
            id: "complex-psychosocial-hospital",
            label: "Complex psychosocial",
            rules: { boostServices: ["ALERT Psychosocial (HIP Complex Care)"], supportTags: ["case-management"], context: "hospital" },
          },
          {
            id: "disability-hospital",
            label: "Disability / NDIS",
            rules: { needTags: ["disability"], context: "hospital" },
            next: {
              title: "Which disability issue?",
              help: "",
              options: [
                { id: "dlo", label: "Hospital access", rules: { boostServices: ["Disability Liaison Officer Program"] } },
                { id: "ndis", label: "NDIS", rules: { boostServices: ["National Disability Insurance Scheme (NDIS)"] } },
                { id: "young-adult-complex", label: "Young adult", rules: { boostServices: ["Young Adult Complex Disability Service"] } },
                { id: "abi", label: "ABI", rules: { boostServices: ["ARBIAS"] } },
              ],
            },
          },
          {
            id: "palliative-hospital",
            label: "Palliative care",
            rules: { boostServices: ["PallCare@Home"], supportTags: ["clinical"] },
          },
        ],
      },
    },
    {
      id: "not-hospital",
      label: "No",
      rules: { context: "community" },
      next: {
        title: "What is the main issue?",
        help: "",
        options: [
          {
            id: "community-safety",
            label: "Safety / FV",
            rules: { needTags: ["family-violence"], supportTags: ["crisis"] },
            next: {
              title: "Which safety pathway?",
              help: "",
              options: [
                { id: "orange-door", label: "FV entry point", rules: { boostServices: ["The Orange Door"] } },
                { id: "safe-steps", label: "24/7 crisis", rules: { boostServices: ["Safe Steps (24 hour crisis support)", "1800 Respect (24 hour counselling support)"] } },
                { id: "djirra", label: "Aboriginal women", rules: { boostServices: ["Djirra – Family Violence and legal support for Aboriginal women"] } },
                { id: "intouch", label: "Multicultural", rules: { boostServices: ["InTouch Multicultural Centre Against Family Violence"] } },
                { id: "sacl", label: "Sexual assault", rules: { boostServices: ["Sexual Assault Crisis Line"] } },
              ],
            },
          },
          {
            id: "community-housing",
            label: "Housing",
            rules: { needTags: ["housing"], situationTags: ["homelessness"] },
            next: {
              title: "Which housing pathway?",
              help: "",
              options: [
                { id: "frontyard", label: "Young person", rules: { boostServices: ["Frontyard Youth Services"] } },
                { id: "crisis-accom", label: "Crisis accommodation", rules: { boostServices: ["Crisis and emergency accommodation"] } },
                { id: "common-ground", label: "Rough sleeping", rules: { boostServices: ["Elizabeth Street Common Ground"] } },
                { id: "launch", label: "General homelessness", rules: { boostServices: ["Launch Housing"] } },
              ],
            },
          },
          {
            id: "community-carer",
            label: "Carer support",
            rules: { needTags: ["carer-family"], situationTags: ["carer"] },
            next: {
              title: "What does the carer need?",
              help: "",
              options: [
                { id: "respite", label: "Respite", rules: { boostServices: ["Carer Gateway - respite"] } },
                { id: "counselling", label: "Counselling", rules: { boostServices: ["Carer Gateway - counselling"] } },
                { id: "carer-info", label: "Information", rules: { boostServices: ["Carers Victoria", "Carer Gateway - counselling", "Carer Gateway - respite"] } },
              ],
            },
          },
          {
            id: "community-money",
            label: "Money / legal",
            rules: { needTags: ["financial-legal"] },
            next: {
              title: "Which system?",
              help: "",
              options: [
                { id: "tac", label: "Transport accident", rules: { boostServices: ["Transport Accident Commission (TAC)"] } },
                { id: "victims", label: "Victim of crime", rules: { boostServices: ["Victim of Crime Financial Assistance Scheme"] } },
                { id: "centrelink", label: "Income support", rules: { boostServices: ["Disability Support Pension", "JobSeeker Payment", "Centrelink"] } },
                { id: "guardianship", label: "Guardianship", rules: { boostServices: ["Office of the Public Advocate (OPA)", "Victorian Civil and Administrative Tribunal (VCAT)"] } },
                { id: "legal", label: "Legal help", rules: { boostServices: ["Victorian Legal Aid", "Women’s Legal Service Victoria"] } },
              ],
            },
          },
          {
            id: "community-transport",
            label: "Transport",
            rules: { needTags: ["transport"] },
            next: {
              title: "What travel issue?",
              help: "",
              options: [
                { id: "vptas", label: "Regional travel", rules: { boostServices: ["Victorian Patient Transport Assistance Scheme (VPTAS)"] } },
                { id: "taxi", label: "Taxi subsidy", rules: { boostServices: ["Multi-purpose taxi program"] } },
                { id: "travellers-aid", label: "Travel support", rules: { boostServices: ["Travellers Aid"] } },
              ],
            },
          },
          {
            id: "community-health",
            label: "Health support",
            rules: { needTags: ["mental-health-aod", "condition-specific"] },
            next: {
              title: "Which health support?",
              help: "",
              options: [
                { id: "aod", label: "AOD", rules: { boostServices: ["DirectLine"] } },
                { id: "distress", label: "Mental health", rules: { boostServices: ["Lifeline", "Beyond Blue"] } },
                { id: "pain", label: "Persistent pain", rules: { boostServices: ["Barbara Walker Centre for Pain Management (BWCPM)"] } },
                { id: "cancer", label: "Cancer support", rules: { boostServices: ["Cancer Council Victoria", "Cancer Care @ Home"] } },
                { id: "dementia", label: "Dementia", rules: { boostServices: ["Dementia Australia"] } },
              ],
            },
          },
          {
            id: "community-identity",
            label: "Identity-specific",
            rules: { needTags: ["identity-specific"] },
            next: {
              title: "Which pathway?",
              help: "",
              options: [
                { id: "aboriginal-health", label: "Aboriginal health", rules: { boostServices: ["Victorian Aboriginal Community Controlled Health Organisation (VACCHO)"] } },
                { id: "aboriginal-legal", label: "Aboriginal legal", rules: { boostServices: ["Victorian Aboriginal Legal Service (VALS)"] } },
                { id: "asylum", label: "Asylum seeker / refugee", rules: { boostServices: ["Asylum Seeker Resource Centre"] } },
                { id: "migrant", label: "Asylum seeker / refugee support", rules: { boostServices: ["Asylum Seeker Resource Centre"] } },
                { id: "lgbtiqa", label: "LGBTIQA+ support", rules: { boostServices: ["QLife WebChat Australia Wide", "Thorne Harbour Health", "With Respect (LGBTIQA+)"] } },
              ],
            },
          },
        ],
      },
    },
    {
      id: "browse-all",
      label: "Browse all",
      rules: { mode: "all" },
    },
  ],
};
