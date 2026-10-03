# Source Trace · เล่ม IS 68076026 (Final)

> สร้างโดย `scripts/source_trace.py` เมื่อ 2026-10-03 · ใช้แทน Change Log เทียบเล่มเดิม (Prompt_Report หัวข้อ 1)
> ตัวเลขผลลัพธ์ทุกค่าในเล่มมาจาก `{{key}}` ใน `book/numbers.json` ซึ่ง `scripts/book_numbers.py` อ่านจากไฟล์ด้านล่าง

## 1 · ตัวเลขและตารางที่สร้างจากข้อมูล (118 key)

| key | ค่าในเล่ม | ใช้ในไฟล์ | แหล่งข้อมูล | คำนวณโดย | DEC |
|---|---|---|---|---|---|
| `Hmax_6m10h` | 259.8 | 03_chapter3.md, 05_appendix.md | `evidence/coverage_simulation.json` | scripts/simulate_coverage.mjs → engine.buildPlan (กรณีเลวร้ายที่สุด) | DEC-41 · DEC-47 |
| `add_hours_hi` | 23 | 03_chapter3.md | `data/corpus_additions.csv` | scripts/book_numbers.py (นับ researcher_result) | DEC-46 |
| `add_hours_lo` | 2 | 03_chapter3.md | `data/corpus_additions.csv` | scripts/book_numbers.py (นับ researcher_result) | DEC-46 |
| `add_pending` | 14 | 03_chapter3.md | `data/corpus_additions.csv` | scripts/book_numbers.py (นับ researcher_result) | DEC-46 |
| `add_total` | 14 | 03_chapter3.md | `data/corpus_additions.csv` | scripts/book_numbers.py (นับ researcher_result) | DEC-46 |
| `additions_table` | ตาราง 14 แถว | 05_appendix.md | `data/corpus_additions.csv` | scripts/book_numbers.py (นับ researcher_result) | DEC-46 |
| `cA_C` | 1.000 | 03_chapter3.md | `evidence/run_local/case_*/summary.json · decisions.csv · plan_items.csv` | scripts/run_local.mjs (engine.js กับผลตอบกลับจำลอง) | — |
| `cA_Hmax` | 259.8 | 03_chapter3.md | `evidence/run_local/case_*/summary.json · decisions.csv · plan_items.csv` | scripts/run_local.mjs (engine.js กับผลตอบกลับจำลอง) | — |
| `cA_R` | 67.72 | 03_chapter3.md | `evidence/run_local/case_*/summary.json · decisions.csv · plan_items.csv` | scripts/run_local.mjs (engine.js กับผลตอบกลับจำลอง) | — |
| `cA_U` | 4 | 03_chapter3.md | `evidence/run_local/case_*/summary.json · decisions.csv · plan_items.csv` | scripts/run_local.mjs (engine.js กับผลตอบกลับจำลอง) | — |
| `cA_claims` | 67 | 03_chapter3.md | `evidence/run_local/case_*/summary.json · decisions.csv · plan_items.csv` | scripts/run_local.mjs (engine.js กับผลตอบกลับจำลอง) | — |
| `cA_decided` | 30 | 03_chapter3.md | `evidence/run_local/case_*/summary.json · decisions.csv · plan_items.csv` | scripts/run_local.mjs (engine.js กับผลตอบกลับจำลอง) | — |
| `cA_ev` | 17 | 03_chapter3.md | `evidence/run_local/case_*/summary.json · decisions.csv · plan_items.csv` | scripts/run_local.mjs (engine.js กับผลตอบกลับจำลอง) | — |
| `cA_gapcov` | 0.69 | 03_chapter3.md | `evidence/run_local/case_*/summary.json · decisions.csv · plan_items.csv` | scripts/run_local.mjs (engine.js กับผลตอบกลับจำลอง) | — |
| `cA_gaps` | 13 | 03_chapter3.md | `evidence/run_local/case_*/summary.json · decisions.csv · plan_items.csv` | scripts/run_local.mjs (engine.js กับผลตอบกลับจำลอง) | — |
| `cA_hours` | 186 | 03_chapter3.md | `evidence/run_local/case_*/summary.json · decisions.csv · plan_items.csv` | scripts/run_local.mjs (engine.js กับผลตอบกลับจำลอง) | — |
| `cA_items` | 5 | 03_chapter3.md | `evidence/run_local/case_*/summary.json · decisions.csv · plan_items.csv` | scripts/run_local.mjs (engine.js กับผลตอบกลับจำลอง) | — |
| `cA_mi` | 7 | 03_chapter3.md | `evidence/run_local/case_*/summary.json · decisions.csv · plan_items.csv` | scripts/run_local.mjs (engine.js กับผลตอบกลับจำลอง) | — |
| `cA_overcap` | 1 | 03_chapter3.md | `evidence/run_local/case_*/summary.json · decisions.csv · plan_items.csv` | scripts/run_local.mjs (engine.js กับผลตอบกลับจำลอง) | — |
| `cA_pa` | 6 | 03_chapter3.md | `evidence/run_local/case_*/summary.json · decisions.csv · plan_items.csv` | scripts/run_local.mjs (engine.js กับผลตอบกลับจำลอง) | — |
| `cA_pii` | 3 | 03_chapter3.md | `evidence/run_local/case_*/summary.json · decisions.csv · plan_items.csv` | scripts/run_local.mjs (engine.js กับผลตอบกลับจำลอง) | — |
| `cA_plan_table` | ตาราง 5 แถว | 03_chapter3.md | `evidence/run_local/case_*/summary.json · decisions.csv · plan_items.csv` | scripts/run_local.mjs (engine.js กับผลตอบกลับจำลอง) | — |
| `cA_prog_agree` | 1.00 | 03_chapter3.md | `evidence/run_local/case_*/summary.json · decisions.csv · plan_items.csv` | scripts/run_local.mjs (engine.js กับผลตอบกลับจำลอง) | — |
| `cA_prog_e` | 475 | 03_chapter3.md | `evidence/run_local/case_*/summary.json · decisions.csv · plan_items.csv` | scripts/run_local.mjs (engine.js กับผลตอบกลับจำลอง) | — |
| `cA_prog_s` | 375 | 03_chapter3.md | `evidence/run_local/case_*/summary.json · decisions.csv · plan_items.csv` | scripts/run_local.mjs (engine.js กับผลตอบกลับจำลอง) | — |
| `cC_abstained` | 2 | 05_appendix.md | `evidence/run_local/case_*/summary.json · decisions.csv · plan_items.csv` | scripts/run_local.mjs (engine.js กับผลตอบกลับจำลอง) | — |
| `cD_R` | 88.14 | 03_chapter3.md | `evidence/run_local/case_*/summary.json · decisions.csv · plan_items.csv` | scripts/run_local.mjs (engine.js กับผลตอบกลับจำลอง) | — |
| `cD_Rlex` | 31.48 | 03_chapter3.md | `evidence/run_local/case_*/summary.json · decisions.csv · plan_items.csv` | scripts/run_local.mjs (engine.js กับผลตอบกลับจำลอง) | — |
| `cause_hours` | 43 | 03_chapter3.md | `evidence/coverage_diagnostics.json` | scripts/coverage_diagnostics.py (PuLP/CBC · ilp_min_*, ilp_max_cov, cause_* ใช้ฉาก before_track) | DEC-41 · DEC-47 |
| `cause_no_item` | 2 | 03_chapter3.md | `evidence/coverage_diagnostics.json` | scripts/coverage_diagnostics.py (PuLP/CBC · ilp_min_*, ilp_max_cov, cause_* ใช้ฉาก before_track) | DEC-41 · DEC-47 |
| `cause_selection` | 17 | 03_chapter3.md | `evidence/coverage_diagnostics.json` | scripts/coverage_diagnostics.py (PuLP/CBC · ilp_min_*, ilp_max_cov, cause_* ใช้ฉาก before_track) | DEC-41 · DEC-47 |
| `config_table` | ตาราง 26 แถว | 03_chapter3.md | `config/project.json · config/models.json` | scripts/book_numbers.py | — |
| `corpus_certs` | 218 | 03_chapter3.md | `data/corpus.csv · data/manifest.json` | scripts/build_corpus.py | DEC-43 |
| `corpus_courses` | 384 | 03_chapter3.md | `data/corpus.csv · data/manifest.json` | scripts/build_corpus.py | DEC-43 |
| `corpus_items` | 602 | 00_front.md, 03_chapter3.md | `data/corpus.csv · data/manifest.json` | scripts/build_corpus.py | DEC-43 |
| `corpus_version` | CORPUS_IS68076026-v1.5-01OCT26 | 03_chapter3.md, 05_appendix.md | `data/corpus.csv · data/manifest.json` | scripts/build_corpus.py | DEC-43 |
| `cov_24m_note` | เมื่อเรียน 10 ชั่วโมงต่อสัปดาห์ แผน 12 18 และ 24 เดือนครอ… | 03_chapter3.md | `evidence/coverage_simulation.json + coverage_diagnostics.json` | scripts/book_numbers.py (ประโยคที่สร้างจากตัวเลข) | DEC-41 |
| `cov_corpus` | 598 | 00_front.md, 03_chapter3.md | `evidence/coverage_simulation.json` | scripts/simulate_coverage.mjs → engine.buildPlan (กรณีเลวร้ายที่สุด) | DEC-41 · DEC-47 |
| `cov_plan` | 538 | 00_front.md, 03_chapter3.md | `evidence/coverage_simulation.json` | scripts/simulate_coverage.mjs → engine.buildPlan (กรณีเลวร้ายที่สุด) | DEC-41 · DEC-47 |
| `cov_plan_cf` | 539 | 03_chapter3.md | `evidence/coverage_whatif.json` | scripts/simulate_coverage.mjs --what-if (สถานการณ์สมมติ) | DEC-46 · DEC-47 |
| `cov_status_note` | ยังไม่ถึงเป้า เพราะรายการเรียนรู้ใหม่ 14 รายการยังรอผู้วิ… | 03_chapter3.md | `evidence/coverage_simulation.json + coverage_diagnostics.json` | scripts/book_numbers.py (ประโยคที่สร้างจากตัวเลข) | DEC-41 |
| `cov_whatif_corpus` | 600 | 03_chapter3.md | `evidence/coverage_whatif.json` | scripts/simulate_coverage.mjs --what-if (สถานการณ์สมมติ) | DEC-46 · DEC-47 |
| `cov_whatif_plan` | 600 | 03_chapter3.md | `evidence/coverage_whatif.json` | scripts/simulate_coverage.mjs --what-if (สถานการณ์สมมติ) | DEC-46 · DEC-47 |
| `coverage_role_table` | ตาราง 20 แถว | 05_appendix.md | `evidence/coverage_simulation.json + coverage_diagnostics.json` | scripts/book_numbers.py (ประโยคที่สร้างจากตัวเลข) | DEC-41 |
| `data_dictionary` | **แท็บ runs** (ผลการทำงาน · เขียนแบบ upsert:run_id) คอลัม… | 05_appendix.md | `config/sheets.json` | scripts/book_numbers.py | — |
| `deletion_contact` | 68076026@kmitl.ac.th | 03_chapter3.md | `config/project.json · config/models.json` | scripts/book_numbers.py | — |
| `domain_table` | ตาราง 5 แถว | 03_chapter3.md | `data/requirements.csv` | scripts/build_reference_data.py | — |
| `engine_version` | engine-2.0.0-03OCT26 | 05_appendix.md | `workflows/manifest.json · workflows/WF_IS_68076026_01OCT26.json · evidence/WF_analysis.md` | scripts/build_workflows.mjs · scripts/validate_workflows.mjs | DEC-42 · DEC-48 |
| `foundation_ext_maps` | 129 | 03_chapter3.md | `data/corpus.csv · data/mappings.csv · data/corpus_change_log.csv` | scripts/build_corpus.py (foundation track) | DEC-45 |
| `hours_max` | 800 | 03_chapter3.md | `data/corpus.csv · data/manifest.json` | scripts/build_corpus.py | DEC-43 |
| `hours_median` | 60 | 03_chapter3.md | `data/corpus.csv · data/manifest.json` | scripts/build_corpus.py | DEC-43 |
| `hours_min` | 2 | 03_chapter3.md | `data/corpus.csv · data/manifest.json` | scripts/build_corpus.py | DEC-43 |
| `ilp_max_cov` | 549 | 03_chapter3.md | `evidence/coverage_diagnostics.json` | scripts/coverage_diagnostics.py (PuLP/CBC · ilp_min_*, ilp_max_cov, cause_* ใช้ฉาก before_track) | DEC-41 · DEC-47 |
| `ilp_max_cov_now` | 549 | 03_chapter3.md | `evidence/coverage_diagnostics.json` | scripts/coverage_diagnostics.py (PuLP/CBC · ilp_min_*, ilp_max_cov, cause_* ใช้ฉาก before_track) | DEC-41 · DEC-47 |
| `ilp_min_hi` | 727 | 03_chapter3.md | `evidence/coverage_diagnostics.json` | scripts/coverage_diagnostics.py (PuLP/CBC · ilp_min_*, ilp_max_cov, cause_* ใช้ฉาก before_track) | DEC-41 · DEC-47 |
| `ilp_min_hi_add` | 236 | 03_chapter3.md | `evidence/coverage_diagnostics.json` | scripts/coverage_diagnostics.py (PuLP/CBC · ilp_min_*, ilp_max_cov, cause_* ใช้ฉาก before_track) | DEC-41 · DEC-47 |
| `ilp_min_lo` | 285 | 03_chapter3.md | `evidence/coverage_diagnostics.json` | scripts/coverage_diagnostics.py (PuLP/CBC · ilp_min_*, ilp_max_cov, cause_* ใช้ฉาก before_track) | DEC-41 · DEC-47 |
| `ilp_min_lo_add` | 166 | 03_chapter3.md | `evidence/coverage_diagnostics.json` | scripts/coverage_diagnostics.py (PuLP/CBC · ilp_min_*, ilp_max_cov, cause_* ใช้ฉาก before_track) | DEC-41 · DEC-47 |
| `manifest_frozen` | ยังไม่ตรึง (ตรึงหลังการทดสอบนำร่องตามหัวข้อ 3.7) | 05_appendix.md | `data/manifest.json` | scripts/update_manifest.py | — |
| `manifest_table` | ตาราง 11 แถว | 05_appendix.md | `data/manifest.json` | scripts/update_manifest.py | — |
| `map_L1` | 2,205 | 03_chapter3.md | `evidence/mapping_review_summary.json · data/mappings.csv` | scripts/review_mappings.py (เกณฑ์ C1–C5) | DEC-11 · DEC-21 |
| `map_L2` | 4,807 | 03_chapter3.md | `evidence/mapping_review_summary.json · data/mappings.csv` | scripts/review_mappings.py (เกณฑ์ C1–C5) | DEC-11 · DEC-21 |
| `map_failed_L1_other` | 134 | 03_chapter3.md | `evidence/mapping_review_summary.json · data/mappings.csv` | scripts/review_mappings.py (เกณฑ์ C1–C5) | DEC-11 · DEC-21 |
| `map_failed_not_L1` | 4,807 | 03_chapter3.md | `evidence/mapping_review_summary.json · data/mappings.csv` | scripts/review_mappings.py (เกณฑ์ C1–C5) | DEC-11 · DEC-21 |
| `map_passed` | 2,071 | 03_chapter3.md | `evidence/mapping_review_summary.json · data/mappings.csv` | scripts/review_mappings.py (เกณฑ์ C1–C5) | DEC-11 · DEC-21 |
| `map_total` | 7,012 | 03_chapter3.md | `evidence/mapping_review_summary.json · data/mappings.csv` | scripts/review_mappings.py (เกณฑ์ C1–C5) | DEC-11 · DEC-21 |
| `max_output_tokens` | 16,384 | 03_chapter3.md | `config/project.json · config/models.json` | scripts/book_numbers.py | DEC-51 · DEC-52 · DEC-53 · DEC-56 |
| `n8n_cases` | 14 | 03_chapter3.md | `evidence/n8n_test_summary.json · evidence/n8n_test_01OCT26.md` | evidence/n8n_s6/s6_suite.py + make_report.py (n8n 2.39.9 จริง · บริการจำลอง) | DEC-48 |
| `n8n_pass` | 14 | 03_chapter3.md | `evidence/n8n_test_summary.json · evidence/n8n_test_01OCT26.md` | evidence/n8n_s6/s6_suite.py + make_report.py (n8n 2.39.9 จริง · บริการจำลอง) | DEC-48 |
| `n8n_version` | 2.39.9 | 03_chapter3.md, 05_appendix.md | `workflows/manifest.json · workflows/WF_IS_68076026_01OCT26.json · evidence/WF_analysis.md` | scripts/build_workflows.mjs · scripts/validate_workflows.mjs | DEC-42 · DEC-48 |
| `plan_experienced_years` | 5 | 03_chapter3.md | `config/project.json · config/models.json` | scripts/book_numbers.py | DEC-51 · DEC-52 · DEC-53 · DEC-56 |
| `prompt_version` | analyst_v1.1 | 03_chapter3.md, 05_appendix.md | `config/project.json · config/models.json` | scripts/book_numbers.py | DEC-51 · DEC-52 · DEC-53 · DEC-56 |
| `r2_repair_pct` | 90 | 03_chapter3.md | `config/project.json · config/models.json` | scripts/book_numbers.py | DEC-51 · DEC-52 · DEC-53 · DEC-56 |
| `real_R15` | 11 | 03_chapter3.md | `evidence/r3_gold/summary_03OCT26.json (ข้อความต้นฉบับของเรซูเมผู้วิจัยอยู่ใน private/ ไม่เข้า git)` | scripts/r3_gold.mjs eval · docs/Gap_03OCT26.md | DEC-51 · DEC-57 |
| `real_R15_r2only` | 56.0 | 03_chapter3.md | `evidence/r3_gold/summary_03OCT26.json (ข้อความต้นฉบับของเรซูเมผู้วิจัยอยู่ใน private/ ไม่เข้า git)` | scripts/r3_gold.mjs eval · docs/Gap_03OCT26.md | DEC-51 · DEC-57 |
| `real_R19` | 10 | 03_chapter3.md | `evidence/r3_gold/summary_03OCT26.json (ข้อความต้นฉบับของเรซูเมผู้วิจัยอยู่ใน private/ ไม่เข้า git)` | scripts/r3_gold.mjs eval · docs/Gap_03OCT26.md | DEC-51 · DEC-57 |
| `real_R19_r2only` | 47.0 | 03_chapter3.md | `evidence/r3_gold/summary_03OCT26.json (ข้อความต้นฉบับของเรซูเมผู้วิจัยอยู่ใน private/ ไม่เข้า git)` | scripts/r3_gold.mjs eval · docs/Gap_03OCT26.md | DEC-51 · DEC-57 |
| `real_claims` | 36 | 03_chapter3.md | `evidence/r3_gold/summary_03OCT26.json (ข้อความต้นฉบับของเรซูเมผู้วิจัยอยู่ใน private/ ไม่เข้า git)` | scripts/r3_gold.mjs eval · docs/Gap_03OCT26.md | DEC-51 · DEC-57 |
| `real_r3_rejected` | 27 | 03_chapter3.md | `evidence/r3_gold/summary_03OCT26.json (ข้อความต้นฉบับของเรซูเมผู้วิจัยอยู่ใน private/ ไม่เข้า git)` | scripts/r3_gold.mjs eval · docs/Gap_03OCT26.md | DEC-51 · DEC-57 |
| `real_rec_lex` | 0.24 | 03_chapter3.md | `evidence/r3_gold/summary_03OCT26.json (ข้อความต้นฉบับของเรซูเมผู้วิจัยอยู่ใน private/ ไม่เข้า git)` | scripts/r3_gold.mjs eval · docs/Gap_03OCT26.md | DEC-51 · DEC-57 |
| `real_rec_stem` | 0.33 | 03_chapter3.md | `evidence/r3_gold/summary_03OCT26.json (ข้อความต้นฉบับของเรซูเมผู้วิจัยอยู่ใน private/ ไม่เข้า git)` | scripts/r3_gold.mjs eval · docs/Gap_03OCT26.md | DEC-51 · DEC-57 |
| `req_r01_table` | ตาราง 8 แถว | 03_chapter3.md | `data/requirements.csv` | scripts/build_reference_data.py | — |
| `retention_days` | 90 | 03_chapter3.md | `config/project.json · config/models.json` | scripts/book_numbers.py | — |
| `retry_backoff_text` | 5 และ 15 วินาที | 03_chapter3.md | `config/models.json (defaults.retry_backoff_ms)` | scripts/book_numbers.py | DEC-48 |
| `role_shared_19_15` | 19 | 03_chapter3.md | `evidence/r3_gold/summary_03OCT26.json (ข้อความต้นฉบับของเรซูเมผู้วิจัยอยู่ใน private/ ไม่เข้า git)` | scripts/r3_gold.mjs eval · docs/Gap_03OCT26.md | DEC-51 · DEC-57 |
| `role_shared_mean_pct` | 76 | 03_chapter3.md | `evidence/r3_gold/summary_03OCT26.json (ข้อความต้นฉบับของเรซูเมผู้วิจัยอยู่ใน private/ ไม่เข้า git)` | scripts/r3_gold.mjs eval · docs/Gap_03OCT26.md | DEC-51 · DEC-57 |
| `role_tasks_per_role` | 8 | 03_chapter3.md | `config/project.json · config/models.json` | scripts/book_numbers.py | DEC-51 · DEC-52 · DEC-53 · DEC-56 |
| `role_tasks_total` | 160 | 03_chapter3.md | `data/role_tasks.csv · data/role_technology.csv · data/skill_links.csv` | scripts/build_role_signals.py | DEC-54 · DEC-55 |
| `role_tech_total` | 375 | 03_chapter3.md | `data/role_tasks.csv · data/role_technology.csv · data/skill_links.csv` | scripts/build_role_signals.py | DEC-54 · DEC-55 |
| `roles_proxy` | 5 | 03_chapter3.md, 05_appendix.md | `data/roles.json` | scripts/build_reference_data.py | — |
| `roles_proxy_ids` | R03 R07 R08 R16 R17 | 03_chapter3.md | `data/roles.json` | scripts/build_reference_data.py | — |
| `roles_table` | ตาราง 20 แถว | 03_chapter3.md | `data/roles.json` | scripts/build_reference_data.py | — |
| `rules_version` | RULES-IS68076026-v2.0 | 03_chapter3.md, 05_appendix.md | `config/project.json · config/models.json` | scripts/book_numbers.py | DEC-51 · DEC-52 · DEC-53 · DEC-56 |
| `sim_cert_6m10h` | 195 | 03_chapter3.md | `evidence/coverage_simulation.json` | scripts/simulate_coverage.mjs → engine.buildPlan (กรณีเลวร้ายที่สุด) | DEC-41 · DEC-47 |
| `sim_course_6m10h` | 526 | 03_chapter3.md | `evidence/coverage_simulation.json` | scripts/simulate_coverage.mjs → engine.buildPlan (กรณีเลวร้ายที่สุด) | DEC-41 · DEC-47 |
| `skill_links_total` | 232 | 03_chapter3.md | `data/role_tasks.csv · data/role_technology.csv · data/skill_links.csv` | scripts/build_role_signals.py | DEC-54 · DEC-55 |
| `soc_proxy_table` | ตาราง 5 แถว | 05_appendix.md | `data/roles.json` | scripts/build_reference_data.py | — |
| `syn_pairs` | 82 | 03_chapter3.md | `evidence/r3_gold/summary_03OCT26.json (ข้อความต้นฉบับของเรซูเมผู้วิจัยอยู่ใน private/ ไม่เข้า git)` | scripts/r3_gold.mjs eval · docs/Gap_03OCT26.md | DEC-51 · DEC-57 |
| `syn_prec_hyb` | 0.97 | 03_chapter3.md | `evidence/r3_gold/summary_03OCT26.json (ข้อความต้นฉบับของเรซูเมผู้วิจัยอยู่ใน private/ ไม่เข้า git)` | scripts/r3_gold.mjs eval · docs/Gap_03OCT26.md | DEC-51 · DEC-57 |
| `syn_rec_hyb` | 0.97 | 03_chapter3.md | `evidence/r3_gold/summary_03OCT26.json (ข้อความต้นฉบับของเรซูเมผู้วิจัยอยู่ใน private/ ไม่เข้า git)` | scripts/r3_gold.mjs eval · docs/Gap_03OCT26.md | DEC-51 · DEC-57 |
| `syn_rec_lex` | 0.72 | 03_chapter3.md | `evidence/r3_gold/summary_03OCT26.json (ข้อความต้นฉบับของเรซูเมผู้วิจัยอยู่ใน private/ ไม่เข้า git)` | scripts/r3_gold.mjs eval · docs/Gap_03OCT26.md | DEC-51 · DEC-57 |
| `synthetic_table` | ตาราง 17 แถว | 03_chapter3.md, 05_appendix.md | `evidence/run_local/case_*/summary.json · decisions.csv · plan_items.csv` | scripts/run_local.mjs (engine.js กับผลตอบกลับจำลอง) | — |
| `tabs_table` | ตาราง 17 แถว | 03_chapter3.md | `config/sheets.json` | scripts/book_numbers.py | — |
| `tabs_total` | 17 | 03_chapter3.md | `config/sheets.json` | scripts/book_numbers.py | — |
| `tests_pass` | 77 | 00_front.md, 03_chapter3.md | `evidence/test_summary.json` | bash scripts/run_all_checks.sh (node --test) | — |
| `tests_total` | 77 | 00_front.md, 03_chapter3.md | `evidence/test_summary.json` | bash scripts/run_all_checks.sh (node --test) | — |
| `text_layer_min_chars` | 200 | 03_chapter3.md | `config/project.json · config/models.json` | scripts/book_numbers.py | — |
| `theta` | 0.15 | 03_chapter3.md | `config/project.json · config/models.json` | scripts/book_numbers.py | — |
| `trace_rows` | 39 | 03_chapter3.md | `workflows/manifest.json · workflows/WF_IS_68076026_01OCT26.json · evidence/WF_analysis.md` | scripts/build_workflows.mjs · scripts/validate_workflows.mjs | DEC-42 · DEC-48 |
| `url_pending_urls` | 28 | 03_chapter3.md | `data/url_manual_check.csv` | นับแถวที่ researcher_result ยังว่าง | DEC-16 |
| `verifier_max_tokens` | 4,096 | 03_chapter3.md | `config/project.json · config/models.json` | scripts/book_numbers.py | DEC-51 · DEC-52 · DEC-53 · DEC-56 |
| `verifier_prompt_version` | verifier_v1.0 | 03_chapter3.md, 05_appendix.md | `config/project.json · config/models.json` | scripts/book_numbers.py | DEC-51 · DEC-52 · DEC-53 · DEC-56 |
| `wf_name` | WF_IS_68076026_01OCT26 | 03_chapter3.md, 05_appendix.md | `workflows/manifest.json · workflows/WF_IS_68076026_01OCT26.json · evidence/WF_analysis.md` | scripts/build_workflows.mjs · scripts/validate_workflows.mjs | DEC-42 · DEC-48 |
| `wf_node_table` | ตาราง 79 แถว | 05_appendix.md | `workflows/manifest.json · workflows/WF_IS_68076026_01OCT26.json · evidence/WF_analysis.md` | scripts/build_workflows.mjs · scripts/validate_workflows.mjs | DEC-42 · DEC-48 |
| `wf_nodes` | 79 | 03_chapter3.md | `workflows/manifest.json · workflows/WF_IS_68076026_01OCT26.json · evidence/WF_analysis.md` | scripts/build_workflows.mjs · scripts/validate_workflows.mjs | DEC-42 · DEC-48 |
| `wf_sections` | 7 | 03_chapter3.md | `workflows/manifest.json · workflows/WF_IS_68076026_01OCT26.json · evidence/WF_analysis.md` | scripts/build_workflows.mjs · scripts/validate_workflows.mjs | DEC-42 · DEC-48 |
| `wsp_max` | 0.9749 | 03_chapter3.md | `data/requirements.csv` | scripts/build_reference_data.py | — |
| `wsp_min` | 0.5128 | 03_chapter3.md | `data/requirements.csv` | scripts/build_reference_data.py | — |

## 2 · ค่าคงที่ของการออกแบบที่เขียนเป็นตัวอักษรในเล่ม

ค่าเหล่านี้เป็นข้อกำหนดของงานวิจัย ไม่ใช่ผลลัพธ์ จึงพิมพ์ตรงได้ ทุกค่ามีแหล่งใน `book/00_fact_sheet.md`

| ค่า | ความหมาย | แหล่ง |
|---|---|---|
| 20 อาชีพ · 30 ข้อ · 600 ข้อ | ขอบเขตข้อกำหนดอ้างอิง | fact sheet F5 · data/requirements.csv |
| 3 โมเดล · อย่างน้อย 2 โมเดลเห็นตรงกัน | การรวมผล R1 · min_usable_models | fact sheet F13 · config/project.json |
| θ = 0.15 · เพดาน 25 คำ · คำพ้อง ≥ 4 อักขระ | กฎ R3 สมการที่ 3.2 | fact sheet F13–F14 · config/project.json · engine.js |
| 6/12/18/24 เดือน · 4.33 สัปดาห์ต่อเดือน | H_max สมการที่ 3.7 | fact sheet F14–F15 · engine.capacityHours |
| PDF ≤ 10 MB ≤ 5 หน้า | เงื่อนไขไฟล์ | fact sheet F5 · config/project.json |
| นำร่อง 5 คน · กลุ่มหลัก 30 คน · κ ≥ 0.61 | แผนการประเมิน | fact sheet F18 · DEC-32 |
| เก็บข้อมูล 90 วัน | จริยธรรมและ PDPA | fact sheet F19 · config/project.json (retention_days) |

## 3 · เอกสารอ้างอิง (23 รายการ · ตรวจว่ามีจริงเมื่อ 1 ต.ค. 2569)

| key | อ้างในไฟล์ | รายการ (ย่อ) |
|---|---|---|
| `vaishampayan2025` | 01_chapter1.md, 02_chapter2.md, 04_references.md | S. Vaishampayan, H. Leary, Y. B. Alebachew, L. Hickman, B. Stevenor, W. Beck, and C. Brown, "Human and LLM-bas |
| `dequadros2025` | 01_chapter1.md, 02_chapter2.md, 04_references.md | A. R. S. de Quadros, W. N. Galvão, V. E. A. Oliveira, A. Vieira, and W. C. Brandão, "Evaluating LLM-based resu |
| `ji2023` | 01_chapter1.md, 02_chapter2.md, 04_references.md | Z. Ji, N. Lee, R. Frieske, T. Yu, D. Su, Y. Xu, E. Ishii, Y. J. Bang, A. Madotto, and P. Fung, "Survey of hall |
| `rashkin2023` | 01_chapter1.md, 02_chapter2.md, 04_references.md | H. Rashkin, V. Nikolaev, M. Lamm, L. Aroyo, M. Collins, D. Das, S. Petrov, G. S. Tomar, I. Turc, and D. Reitte |
| `onet31` | 01_chapter1.md, 02_chapter2.md, 03_chapter3.md, 04_references.md, 05_appendix.md | National Center for O\*NET Development, "O\*NET 31.0 Database," O\*NET Resource Center, 2026. [ออนไลน์]. เข้าถ |
| `smith2007` | 02_chapter2.md, 04_references.md | R. Smith, "An overview of the Tesseract OCR engine," in *Proc. 9th Int. Conf. Document Analysis and Recognitio |
| `docai` | 02_chapter2.md, 03_chapter3.md, 04_references.md | Google Cloud, "Processor list," Document AI Documentation, 2026. [ออนไลน์]. เข้าถึงได้จาก: https://docs.cloud. |
| `pdpa2562` | 02_chapter2.md, 03_chapter3.md, 04_references.md | "พระราชบัญญัติคุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562," *ราชกิจจานุเบกษา*, เล่ม 136, ตอนที่ 69 ก, หน้า 52–95, 27 พ.ค |
| `min2023` | 02_chapter2.md, 04_references.md | S. Min, K. Krishna, X. Lyu, M. Lewis, W.-t. Yih, P. W. Koh, M. Iyyer, L. Zettlemoyer, and H. Hajishirzi, "FAct |
| `gao2023` | 02_chapter2.md, 04_references.md | L. Gao, Z. Dai, P. Pasupat, A. Chen, A. T. Chaganty, Y. Fan, V. Zhao, N. Lao, H. Lee, D.-C. Juan, and K. Guu,  |
| `wang2023` | 02_chapter2.md, 04_references.md | X. Wang, J. Wei, D. Schuurmans, Q. Le, E. Chi, S. Narang, A. Chowdhery, and D. Zhou, "Self-consistency improve |
| `zheng2023` | 02_chapter2.md, 04_references.md | L. Zheng, W.-L. Chiang, Y. Sheng, S. Zhuang, Z. Wu, Y. Zhuang, Z. Lin, Z. Li, D. Li, E. P. Xing, H. Zhang, J.  |
| `magron2024` | 02_chapter2.md, 03_chapter3.md, 04_references.md | A. Magron, A. Dai, M. Zhang, S. Montariol, and A. Bosselut, "JOBSKAPE: A framework for generating synthetic jo |
| `li2026` | 02_chapter2.md, 04_references.md | A. Li, Y. Li, and X. Gao, "Personalized learning path recommendation based on knowledge graphs: A survey," *El |
| `khuller1999` | 02_chapter2.md, 03_chapter3.md, 04_references.md | S. Khuller, A. Moss, and J. Naor, "The budgeted maximum coverage problem," *Information Processing Letters*, v |
| `davis1989` | 02_chapter2.md, 03_chapter3.md, 04_references.md | F. D. Davis, "Perceived usefulness, perceived ease of use, and user acceptance of information technology," *MI |
| `hevner2004` | 03_chapter3.md, 04_references.md | A. R. Hevner, S. T. March, J. Park, and S. Ram, "Design science in information systems research," *MIS Quarter |
| `driveexport` | 03_chapter3.md, 04_references.md | Google, "Export MIME types for Google Workspace documents," Google Drive API Documentation, 2026. [ออนไลน์]. เ |
| `n8ngoogle` | 03_chapter3.md, 04_references.md | n8n, "Google credentials," n8n Documentation, 2026. [ออนไลน์]. เข้าถึงได้จาก: https://docs.n8n.io/integrations |
| `cohen1960` | 03_chapter3.md, 04_references.md | J. Cohen, "A coefficient of agreement for nominal scales," *Educational and Psychological Measurement*, vol. 2 |
| `landis1977` | 03_chapter3.md, 04_references.md | J. R. Landis and G. G. Koch, "The measurement of observer agreement for categorical data," *Biometrics*, vol.  |
| `sokolova2009` | 03_chapter3.md, 04_references.md | M. Sokolova and G. Lapalme, "A systematic analysis of performance measures for classification tasks," *Informa |
| `efron1993` | 03_chapter3.md, 04_references.md | B. Efron and R. J. Tibshirani, *An Introduction to the Bootstrap*. New York, NY, USA: Chapman & Hall, 1993. |

## 4 · จุดที่แหล่งข้อมูลขัดกันและวิธีตัดสิน

| เรื่อง | แหล่ง A | แหล่ง B | ใช้ค่า | เหตุผล |
|---|---|---|---|---|
| จำนวนรายการในคลัง | Prompt_Report ภาคผนวก ก: 571 | numbers.json: 602 | numbers.json | คลังรุ่น v1.5 เพิ่มรายการพื้นฐาน (DEC-45) และ Prompt สั่งให้เชื่อ numbers.json |
| จำนวน mapping | Prompt_Report: 6,883 | numbers.json: 7,012 | numbers.json | สร้างใหม่จาก build_corpus.py รุ่น v1.5 |
| แผนจำลอง 6 เดือน 10 ชม. | Prompt_Report: 489 | numbers.json: 538 | numbers.json | ขยายรายการพื้นฐานไปทุกอาชีพ (DEC-45) · ยังไม่รวมรายการใหม่ที่รอผู้วิจัยยืนยัน (DEC-46) |
| ความครอบคลุมของคลัง | เป้า 600 (DEC-41) | numbers.json: 598 | numbers.json | ห้ามนับรายการที่ยังไม่ยืนยัน (กติกาข้อ 2–3) · เล่มรายงานตามจริงผ่าน cov_status_note |
| ผลของ de Quadros et al. | fact sheet F2: ต่างกันอย่างมีนัยสำคัญ | — | เขียนว่า ให้ผลต่างกัน | ไม่ได้ตรวจการทดสอบสถิติในต้นฉบับ จึงไม่ใช้คำว่ามีนัยสำคัญ (Prompt_Report 8.2) |
| เลขเทสต์ | Prompt_Report: 51 ผ่าน (รุ่น WF_Final_IS) | numbers.json: 77/77 | numbers.json | เพิ่มเทสต์ workflow เดียวและ plan_strategy ใน Phase 2 |
