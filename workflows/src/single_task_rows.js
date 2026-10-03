// WF_IS_68076026_01OCT26 · Build Task Rows (DEC-55) — แถว role_task_decisions หนึ่งแถวต่องานหลักของอาชีพ
return $('Apply Rules R0-R6').first().json.eval.task_decisions.map((t) => ({ json: { run_id: t.run_id, task_id: t.task_id, task_text: t.task_text, final_status: t.final_status,
  agreement_level: t.agreement_level, n_usable_models: t.n_usable_models, rule_flags: t.rule_flags, evidence_quote: t.evidence_quote, created_at: t.created_at } }));
