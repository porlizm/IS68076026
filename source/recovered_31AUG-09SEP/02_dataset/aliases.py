# -*- coding: utf-8 -*-
"""
element_aliases lexicon  —  frozen 28 AUG 2026
Derivation rule (documented, reproducible):
  A1. O*NET element name + head nouns/verbs of the official element description
  A2. For Work Activities (4.A.*): IT-relevant IWA titles under that GWA (Data_Set.xlsx / F11_GWA_IWA_DWA)
  A3. For Essential/Transferable Skills (2.A.*, 2.B.*): linked Work-Activity titles (F13/F15 crosswalks)
  A4. Resume surface forms in common use for IT roles (curated by the researcher)
Aliases are element-level (not role-level) so that the evidence-relevance rule cannot
become more lenient for one role than another. Frozen before data collection.
"""
ALIASES = {
# ---------- Essential Skills (2.A.*) ----------
"2.A.1.a": ["reading comprehension","read documentation","technical documentation","specification","requirements document","read specs","rfc","reviewed documents","documentation review"],
"2.A.1.b": ["active listening","stakeholder interview","requirements gathering","gathered requirements","user interview","listened to stakeholders","elicitation","client meeting"],
"2.A.1.c": ["writing","technical writing","wrote documentation","authored","report writing","documented","runbook","user guide","published","white paper","readme"],
"2.A.1.d": ["speaking","presented","presentation","demo","briefing","spoke at","public speaking","stand-up","knowledge sharing session","pitched"],
"2.A.1.e": ["mathematics","applied mathematics","statistics","statistical","linear algebra","calculus","numerical methods","quantitative analysis","probability"],
"2.A.2.a": ["critical thinking","root cause analysis","evaluated alternatives","trade-off analysis","assessed options","analytical reasoning","weighed pros and cons","design review"],
"2.A.2.b": ["active learning","self-taught","learned","upskilled","certification","completed course","continuous learning","kept up to date","new technology adoption"],
"2.A.2.d": ["monitoring","monitored","observability","tracked performance","kpi tracking","dashboard monitoring","alerting","health check","performance monitoring"],
# ---------- Transferable Skills (2.B.*) ----------
"2.B.1.b": ["coordination","coordinated","cross-functional","liaised","aligned teams","worked with teams","stakeholder coordination","scrum ceremonies"],
"2.B.2.i": ["complex problem solving","solved","resolved","troubleshooting complex issues","debugged","incident resolution","root cause","postmortem","problem solving"],
"2.B.3.a": ["operations analysis","requirements analysis","needs analysis","business requirements","gap analysis","feasibility study","as-is to-be analysis"],
"2.B.3.b": ["technology design","system design","solution design","architecture design","designed system","technical design document","prototype","hld","lld"],
"2.B.3.e": ["programming","coding","software development","developed","implemented","wrote code","python","java","javascript","typescript","c#","go","sql","scripting","api development","refactored"],
"2.B.3.g": ["operations monitoring","system monitoring","watched dashboards","observed system behavior","uptime monitoring","log monitoring","noc"],
"2.B.3.k": ["troubleshooting","debugging","diagnosed","fault isolation","incident triage","fixed defects","resolved outage","root cause analysis"],
"2.B.3.m": ["quality control analysis","quality assurance","qa","testing","test case","code review","inspection","defect analysis","validation","verification"],
"2.B.4.e": ["judgment and decision making","decision making","prioritized","selected approach","made trade-offs","chose technology","approved","recommended"],
"2.B.4.g": ["systems analysis","system analysis","analyzed system","impact analysis","data flow","process modeling","how the system works","dependency analysis"],
"2.B.4.h": ["systems evaluation","performance evaluation","benchmarking","measured system performance","capacity assessment","evaluated system","slo","sla review"],
"2.B.5.a": ["time management","met deadlines","on schedule","sprint planning","prioritized workload","delivered on time","timeboxed"],
"2.B.5.d": ["management of personnel resources","team management","managed team","staffing","resource allocation","assigned work","people management","led team of"],
# ---------- Knowledge (2.C.*) ----------
"2.C.1.a": ["administration and management","project management","strategic planning","resource planning","business operations","budgeting","governance","leadership","pmp"],
"2.C.1.e": ["customer and personal service","customer service","client support","service desk","user support","customer requirements","sla","stakeholder management","end-user"],
"2.C.3.a": ["computers and electronics","computer systems","hardware","software","operating system","linux","windows","server","application","programming","computer science"],
"2.C.3.b": ["engineering and technology","engineering","technical design","applied technology","system engineering","technology stack","technical architecture"],
"2.C.3.c": ["design","ui design","ux design","interface design","design principles","wireframe","prototype","figma","blueprint","technical drawing"],
"2.C.4.a": ["mathematics","statistics","algebra","calculus","probability","statistical modeling","numerical analysis","quantitative"],
"2.C.7.a": ["english language","english","technical english","business english","toeic","ielts","english proficiency","wrote in english","english communication"],
"2.C.8.b": ["law and government","regulation","compliance","legal","policy","gdpr","pdpa","regulatory requirements","chain of custody","legislation"],
"2.C.9.a": ["telecommunications","networking","network","tcp/ip","routing","switching","bgp","vpn","firewall","lan","wan","dns"],
# ---------- Work Activities (4.A.*) ----------
"4.A.1.a.1": ["getting information","gathered information","collected data","research","investigated","read documents","gathered requirements","data collection","log collection"],
"4.A.1.a.2": ["monitoring processes","monitored operations","monitored systems","monitored equipment","observability","alerting","monitor operation of computer or information technologies","compliance monitoring"],
"4.A.1.b.1": ["identifying objects actions and events","identified issues","detected","recognized patterns","classified","identified opportunities","anomaly detection","event identification"],
"4.A.1.b.2": ["inspecting equipment structures or materials","inspection","tested performance of computer or information systems","hardware inspection","equipment check","system test","audit of equipment"],
"4.A.1.b.3": ["estimating quantifiable characteristics","estimation","estimated effort","story points","sizing","cost estimation","capacity estimate","measured"],
"4.A.2.a.1": ["judging the qualities","evaluated performance","assessed quality","vendor evaluation","evaluated the characteristics usefulness or performance of products or technologies","feasibility assessment","tool selection"],
"4.A.2.a.2": ["processing information","data processing","etl","data cleaning","compiled records","aggregated data","transformed data","reconciled data","validated data quality"],
"4.A.2.a.3": ["evaluating information to determine compliance with standards","compliance check","audit","standards compliance","policy compliance","examined documentation for accuracy or compliance","conformance review"],
"4.A.2.a.4": ["analyzing data or information","data analysis","analyzed","analytics","analyzed performance of systems or equipment","analyzed data to improve operations","statistical analysis","log analysis","reporting"],
"4.A.2.b.1": ["making decisions and solving problems","decision making","problem solving","diagnose system or equipment problems","determined operational methods or procedures","resolved","selected"],
"4.A.2.b.2": ["thinking creatively","design computer or information systems or applications","design databases","designed","developed new approach","innovation","created solution","proposed design","prototyping"],
"4.A.2.b.3": ["updating and using relevant knowledge","maintain current knowledge in area of expertise","kept up to date","continuous learning","certification","training attended","research new technology"],
"4.A.2.b.4": ["developing objectives and strategies","roadmap","strategy","develop organizational policies systems or processes","defined objectives","technical strategy","okr","planning"],
"4.A.2.b.5": ["scheduling work and activities","scheduling","sprint schedule","release schedule","planned activities","calendar","timeline planning","job scheduling"],
"4.A.2.b.6": ["organizing planning and prioritizing work","planning","prioritization","backlog grooming","work planning","organized tasks","sprint planning","project planning"],
"4.A.3.b.1": ["working with computers","program computer systems","implement security measures for computer or information systems","set up computer systems networks or other information systems","resolve computer problems","operate computer systems","process digital or online data","coding","deployment","configuration"],
"4.A.3.b.5": ["repairing and maintaining electronic equipment","hardware maintenance","maintain electronic computer or other technical equipment","repaired","replaced hardware","device maintenance","patching"],
"4.A.3.b.6": ["documenting recording information","documentation","document technical designs procedures or activities","prepare reports of operational or procedural activities","maintain operational records","wrote report","logged","recorded","runbook","ticket notes"],
"4.A.4.a.1": ["interpreting the meaning of information for others","explain technical details of products or services","explained","translated technical to business","briefed stakeholders","presented findings","explain regulations policies or procedures"],
"4.A.4.a.2": ["communicating with supervisors peers or subordinates","team communication","communicate with others about specifications or project details","reported to manager","stand-up","collaborated with team","internal communication"],
"4.A.4.a.3": ["communicating with people outside the organization","client communication","vendor communication","external stakeholders","provide information or assistance to the public","customer meeting"],
"4.A.4.a.4": ["establishing and maintaining interpersonal relationships","develop professional relationships or networks","built relationships","stakeholder relationship","networking","teamwork","cross-team collaboration"],
"4.A.4.a.7": ["resolving conflicts and negotiating with others","negotiate contracts or agreements","conflict resolution","mediated","negotiated","resolve personnel or operational problems","vendor negotiation"],
"4.A.4.b.1": ["coordinating the work and activities of others","coordinate with others to resolve problems","assign work to others","coordinated team","task assignment","cross-functional coordination"],
"4.A.4.b.2": ["developing and building teams","team building","provide support or encouragement to others","mentored team","onboarded new members","built the team","hiring"],
"4.A.4.b.3": ["training and teaching others","train others on operational or work procedures","training","taught","workshop","onboarding training","knowledge transfer","internal training session"],
"4.A.4.b.4": ["guiding directing and motivating subordinates","direct organizational operations activities or procedures","supervise personnel activities","supervised","led","managed direct reports","team lead"],
"4.A.4.b.5": ["coaching and developing others","coach others","mentoring","mentored","coached","career development","1:1 coaching","peer coaching"],
"4.A.4.b.6": ["providing consultation and advice to others","advise others on the design or use of technologies","advise others on business or operational matters","consulting","advised","technical consultation","recommendation to stakeholders"],
"4.A.4.c.1": ["performing administrative activities","administrative","perform administrative or clerical activities","issue documentation","record keeping","reporting administration","asset register"],
"4.A.4.c.3": ["monitoring and controlling resources","monitor resources or inventories","purchase goods or services","resource management","budget control","license management","capacity management","inventory"],
}
