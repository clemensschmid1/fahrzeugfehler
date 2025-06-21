// Test script to verify quality filtering logic
// Run with: npx tsx scripts/test-quality-filter.ts

const SCORE_THRESHOLDS = {
  seo_score: 50,
  content_score: 70,
  expertise_score: 60,
  helpfulness_score: 40
};

function checkQualityScores(metadata: any): { status: string; failedScores: string[] } {
  const failedScores = [];
  
  for (const [scoreField, threshold] of Object.entries(SCORE_THRESHOLDS)) {
    const score = metadata[scoreField];
    if (score !== null && score !== undefined && score < threshold) {
      failedScores.push(`${scoreField}: ${score} < ${threshold}`);
    }
  }

  const status = failedScores.length > 0 ? 'bin' : 'live';
  
  return { status, failedScores };
}

// Test cases
const testCases = [
  {
    name: "All scores above threshold - should be LIVE",
    metadata: {
      seo_score: 75,
      content_score: 85,
      expertise_score: 80,
      helpfulness_score: 70
    }
  },
  {
    name: "SEO score below threshold - should be BIN",
    metadata: {
      seo_score: 30,
      content_score: 85,
      expertise_score: 80,
      helpfulness_score: 70
    }
  },
  {
    name: "Content score below threshold - should be BIN",
    metadata: {
      seo_score: 75,
      content_score: 50,
      expertise_score: 80,
      helpfulness_score: 70
    }
  },
  {
    name: "Expertise score below threshold - should be BIN",
    metadata: {
      seo_score: 75,
      content_score: 85,
      expertise_score: 40,
      helpfulness_score: 70
    }
  },
  {
    name: "Helpfulness score below threshold - should be BIN",
    metadata: {
      seo_score: 75,
      content_score: 85,
      expertise_score: 80,
      helpfulness_score: 20
    }
  },
  {
    name: "Multiple scores below threshold - should be BIN",
    metadata: {
      seo_score: 30,
      content_score: 50,
      expertise_score: 40,
      helpfulness_score: 20
    }
  },
  {
    name: "Null scores - should be LIVE (null scores are ignored)",
    metadata: {
      seo_score: null,
      content_score: null,
      expertise_score: null,
      helpfulness_score: null
    }
  },
  {
    name: "Mixed null and low scores - should be BIN",
    metadata: {
      seo_score: null,
      content_score: 50,
      expertise_score: null,
      helpfulness_score: 20
    }
  }
];

console.log("Testing Quality Filter Logic\n");
console.log("Thresholds:", SCORE_THRESHOLDS);
console.log("=".repeat(60));

testCases.forEach((testCase, index) => {
  const result = checkQualityScores(testCase.metadata);
  
  console.log(`\nTest ${index + 1}: ${testCase.name}`);
  console.log("Scores:", testCase.metadata);
  console.log("Result:", result.status.toUpperCase());
  
  if (result.failedScores.length > 0) {
    console.log("Failed scores:", result.failedScores.join(", "));
  }
  
  // Verify expected behavior
  const expectedStatus = testCase.name.includes("should be LIVE") ? "live" : "bin";
  const passed = result.status === expectedStatus;
  console.log(`Status: ${passed ? "✅ PASS" : "❌ FAIL"}`);
});

console.log("\n" + "=".repeat(60));
console.log("Quality filter test completed!"); 