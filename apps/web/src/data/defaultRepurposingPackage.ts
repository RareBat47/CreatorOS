import { RepurposingPackage } from "@creatoros/scene-schema";

export const defaultRepurposingPackage: RepurposingPackage = {
  shortFormVideo: {
    title: "The GPU Squeeze: 3 Steps to Slash Cloud Inference Bills",
    caption: "Stop paying for idle compute clusters. Developers killed enterprise SaaS budgets in 2024. Here's the fix.",
    description: "An engineer's breakdown of GPU utilization, prefix caching, and batch scheduling in production AI applications.",
    hashtags: ["#AIEngineering", "#DevOps", "#CloudComputing", "#Remotion", "#SoftwareArchitecture"],
    soundRecommendation: "Cyberpunk Tech Undercurrent (120 BPM Lo-Fi)",
    callToAction: "Drop your biggest AWS bill shock in the comments or get the full architecture audit at CreatorOS.",
    platformVariants: {
      tiktok: {
        caption: "Your VP of Sales didn't bleed the budget — idle GPUs did 💀 #tech #ai #coding #developer #devops",
        hashtags: ["#tech", "#ai", "#coding", "#developer", "#devops"],
        soundRecommendation: "Original Sound - Tech Contrarian",
      },
      shorts: {
        caption: "Why 80% of Startups Overpay for AI Infrastructure by 300% #Shorts #Technology #Cloud",
        hashtags: ["#Shorts", "#Technology", "#Cloud", "#Programming"],
        soundRecommendation: "Minimal Synthwave Pulse",
      },
      reels: {
        caption: "How we cut GPU cluster burn rate by 68% in 3 days. Save this for your next sprint retrospective 💾",
        hashtags: ["#softwareengineer", "#infra", "#cloudbills", "#aistartup"],
        soundRecommendation: "Trending Ambient Electronics",
      },
    },
  },
  twitterThread: {
    hookTweet: "Your cloud compute invoice isn't high because of user traffic.\n\nIt's high because developers are lazy with idle GPU cluster allocations.\n\nHere is the postmortem of 4,000 GPU setups and how to cut bills by 60%+ 🧵👇",
    tweets: [
      "1/ Compute clusters spin up in seconds, but auto-down-scaling requires rigorous architectural checks. Most seed and Series A teams skip this entirely.",
      "2/ The #1 culprit: Fixed H100 reservations allocated for dev instances. A developer goes to sleep at 2 AM, and the $4/hr instance runs for 14 hours untouched.",
      "3/ Second silent killer: Zero prefix caching in LLM pipelines. If your system prompt is 2,500 tokens and you evaluate 10,000 queries/day, you're recomputing identical KV matrices thousands of times.",
      "4/ The 3-step mitigation playbook:\n- Enforce aggressive 15m idle shutdown on non-prod clusters\n- Route deterministic prompts through vLLM / SGLang prefix caches\n- Switch batch background tasks to spot instances with state recovery.",
      "5/ The result? One Series B client dropped their monthly compute invoice from $38,000 down to $12,400 with zero degradation in end-user latency.",
    ],
    ctaTweet: "If you want the production Remotion templates and multi-model script prompts that generated this breakdown, check out CreatorOS.\n\nRT the first tweet if this saved your team an AWS heart attack!",
  },
  linkedinPost: {
    hook: "The modern enterprise software sales cycle isn't slowing down because of macro headwinds. It's slowing down because engineering teams now control the checkbook.",
    content: "Last month, our team audited 1,400 seed to Series B architecture proposals.\n\nThe most recurring failure mode wasn't model accuracy or benchmark performance. It was unit economics.\n\nWhen your cost of goods sold (COGS) exceeds 40% due to unoptimized inference clusters, your gross margins collapse before product-market fit.\n\nHere are the 3 structural changes we implemented across high-throughput production clusters:\n\n1. Automated Idle Reaper: Hard cut-off at 15 minutes of zero CUDA kernel utilization.\n2. Key-Value Cache Deduplication: 60% latency and compute drop for multi-turn conversational agents.\n3. Spot Instance Fallback Matrix: Resilient queues for async batch enrichment jobs.\n\nCloud providers make their quarterly numbers on your team's architectural complacency. Treat compute budgets like production code.",
    takeaways: [
      "Fixed GPU instances without auto-reaping destroy startup gross margins.",
      "Prefix caching cuts repetitive prompt processing cost by over half.",
      "Engineering leaders must own cloud unit economics, not just platform uptime.",
    ],
    cta: "How does your engineering team enforce cloud compute boundaries? Let's discuss in the comments.",
    hashtags: ["#SoftwareEngineering", "#CloudInfrastructure", "#DevOps", "#ArtificialIntelligence", "#CTO"],
  },
  newsletterExcerpt: {
    subjectLine: "Issue #48: The GPU Squeeze and How to Cut Cloud Burn",
    previewText: "Why 4,000 clusters spun down idle while startups burned runway...",
    body: "## The Anatomy of an Overpriced Cloud Invoice\n\nThere is an unspoken secret in modern AI engineering: most enterprise clusters spend over 60% of their compute cycle waiting for I/O or sitting in idle states while developers debug on localhost.\n\nWhen we dissected cloud spending across 40 AI teams this quarter, the root cause was rarely user surges. It was the lack of architectural guardrails.\n\n### The Actionable Checklist\n1. **Audit Idle Nodes:** Run an automated script to detect <5% GPU utilization over a rolling 30-minute window.\n2. **Enable Paged Attention & Prefix Caching:** Ensure repeated system instructions aren't recomputed on every call.\n3. **Decouple Fast-Path Inference from Batch Analysis:** Don't hold GPU memory reserved for jobs that can run on an asynchronous worker pool.\n\nNext week, we'll dive deep into our Remotion video rendering pipeline benchmarks.",
    callToAction: "Subscribe to CreatorOS Engineering Dispatch for weekly non-linear architecture teardowns.",
  },
  quotePosts: [
    "\"Cloud providers make their quarterly numbers on your team's architectural complacency.\"",
    "\"Most startups need an SQLite index, not a distributed vector cluster burning $2k/month.\"",
  ],
  followUpVideoIdeas: [
    "Show terminal recordings of idle H100 instances draining budget in real-time.",
    "Benchmark vLLM vs Ollama vs TensorRT-LLM on a single consumer GPU.",
  ],
};
