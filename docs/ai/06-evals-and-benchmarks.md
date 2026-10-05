# 06 - Evals & Benchmarks: CreatorOS

## 1. Evaluation Dimensions
We evaluate the Model Council performance on a weekly benchmark suite:

| Dimension | Metric | Target |
| :--- | :--- | :--- |
| **Hook Grip** | 3-Second Retention Prediction | > 85% |
| **Brand Fidelity** | Alignment with Creator Memory voice | > 90% |
| **Banned Word Violations** | Occurrences per 100 generations | 0.0 |
| **Schema Conformance** | First-pass Zod parse success rate | > 98% |
| **Generation Latency** | Full Council pipeline execution time | < 12 seconds |

## 2. Automated Eval Harness
Vitest integration tests in `packages/model-router/tests` execute synthetic evaluation prompts and verify response schema compliance and tone consistency across model versions.
