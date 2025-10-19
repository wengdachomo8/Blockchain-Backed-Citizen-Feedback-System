import { Cl } from "@stacks/transactions";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const wallet_1 = accounts.get("wallet_1")!;
const wallet_2 = accounts.get("wallet_2")!;
const wallet_3 = accounts.get("wallet_3")!;

describe("Citizen Feedback System with Analytics Dashboard", () => {
  beforeEach(() => {
    // Reset simnet state before each test
  });

  describe("Core Functionality", () => {
    it("should allow citizens to register", () => {
      const { result } = simnet.callPublicFn("citizen-feedback", "register-citizen", [], wallet_1);
      expect(result).toBeOk(Cl.bool(true));
    });

    it("should prevent double registration", () => {
      // Register first time
      simnet.callPublicFn("citizen-feedback", "register-citizen", [], wallet_1);
      
      // Try to register again
      const { result } = simnet.callPublicFn("citizen-feedback", "register-citizen", [], wallet_1);
      expect(result).toBeErr(Cl.uint(101)); // ERR-ALREADY-REGISTERED
    });

    it("should allow admin to create proposals", () => {
      const { result } = simnet.callPublicFn(
        "citizen-feedback", 
        "create-proposal",
        [
          Cl.stringAscii("New Park Proposal"),
          Cl.stringAscii("Should we build a new park in the city center?"),
          Cl.uint(100)
        ],
        deployer
      );
      expect(result).toBeOk(Cl.uint(1));
    });

    it("should allow registered citizens to vote", () => {
      // Register citizen
      simnet.callPublicFn("citizen-feedback", "register-citizen", [], wallet_1);
      
      // Create proposal
      simnet.callPublicFn(
        "citizen-feedback", 
        "create-proposal",
        [
          Cl.stringAscii("Test Proposal"),
          Cl.stringAscii("Test description"),
          Cl.uint(100)
        ],
        deployer
      );

      // Vote on proposal
      const { result } = simnet.callPublicFn(
        "citizen-feedback", 
        "submit-vote",
        [Cl.uint(1), Cl.bool(true)],
        wallet_1
      );
      expect(result).toBeOk(Cl.bool(true));
    });

    it("should allow registered citizens to submit feedback", () => {
      // Register citizen
      simnet.callPublicFn("citizen-feedback", "register-citizen", [], wallet_1);
      
      // Create proposal
      simnet.callPublicFn(
        "citizen-feedback", 
        "create-proposal",
        [
          Cl.stringAscii("Feedback Test"),
          Cl.stringAscii("Test proposal for feedback"),
          Cl.uint(100)
        ],
        deployer
      );

      // Submit feedback
      const { result } = simnet.callPublicFn(
        "citizen-feedback", 
        "submit-feedback",
        [Cl.uint(1), Cl.stringAscii("This is a great proposal!")],
        wallet_1
      );
      expect(result).toBeOk(Cl.bool(true));
    });
  });

  describe("Analytics Dashboard Features", () => {
    beforeEach(() => {
      // Setup test data
      simnet.callPublicFn("citizen-feedback", "register-citizen", [], wallet_1);
      simnet.callPublicFn("citizen-feedback", "register-citizen", [], wallet_2);
      
      // Create test proposals
      simnet.callPublicFn(
        "citizen-feedback", 
        "create-proposal",
        [
          Cl.stringAscii("Analytics Test 1"),
          Cl.stringAscii("First test proposal for analytics"),
          Cl.uint(100)
        ],
        deployer
      );
      
      simnet.callPublicFn(
        "citizen-feedback", 
        "create-proposal",
        [
          Cl.stringAscii("Analytics Test 2"), 
          Cl.stringAscii("Second test proposal for analytics"),
          Cl.uint(100)
        ],
        deployer
      );
    });

    it("should generate system analytics report", () => {
      const { result } = simnet.callPublicFn(
        "citizen-feedback",
        "generate-system-analytics-report",
        [],
        deployer
      );
      expect(result).toBeOk(Cl.uint(1));
    });

    it("should update citizen engagement metrics", () => {
      const { result } = simnet.callPublicFn(
        "citizen-feedback",
        "update-citizen-engagement-metrics",
        [Cl.principal(wallet_1)],
        wallet_1
      );
      expect(result).toBeOk(Cl.bool(true));
    });

    it("should analyze proposal performance", () => {
      // Vote on proposal first
      simnet.callPublicFn("citizen-feedback", "submit-vote", [Cl.uint(1), Cl.bool(true)], wallet_1);
      simnet.callPublicFn("citizen-feedback", "submit-vote", [Cl.uint(1), Cl.bool(false)], wallet_2);

      const { result } = simnet.callPublicFn(
        "citizen-feedback",
        "analyze-proposal-performance",
        [Cl.uint(1)],
        deployer
      );
      expect(result).toBeOk(Cl.bool(true));
    });

    it("should generate system health report", () => {
      const { result } = simnet.callPublicFn(
        "citizen-feedback",
        "generate-system-health-report",
        [Cl.uint(1)],
        deployer
      );
      expect(result).toBeOk(Cl.bool(true));
    });

    it("should calculate system health score", () => {
      const { result } = simnet.callReadOnlyFn(
        "citizen-feedback",
        "calculate-system-health-score",
        [],
        deployer
      );
      expect(result).toBeOk(Cl.uint(expect.any(Number)));
    });

    it("should get analytics dashboard summary", () => {
      const { result } = simnet.callReadOnlyFn(
        "citizen-feedback",
        "get-analytics-dashboard-summary",
        [],
        deployer
      );
      
      expect(result).toBeOk(Cl.tuple({
        "system-overview": Cl.tuple({
          "total-proposals": Cl.uint(expect.any(Number)),
          "total-categories": Cl.uint(expect.any(Number)),
          "analytics-reports": Cl.uint(expect.any(Number))
        }),
        "metrics-available": Cl.tuple({
          "citizen-engagement": Cl.bool(true),
          "proposal-analytics": Cl.bool(true),
          "system-health": Cl.bool(true),
          "participation-tracking": Cl.bool(true)
        })
      }));
    });

    it("should get top engagement metrics", () => {
      const { result } = simnet.callReadOnlyFn(
        "citizen-feedback",
        "get-top-engagement-metrics",
        [],
        deployer
      );
      
      expect(result).toBeOk(Cl.tuple({
        "high-engagement-threshold": Cl.uint(80),
        "medium-engagement-threshold": Cl.uint(50),
        "consistency-bonus": Cl.uint(20),
        "participation-weight": Cl.uint(60),
        "feedback-weight": Cl.uint(40)
      }));
    });

    it("should retrieve system analytics after generation", () => {
      // Generate report first
      simnet.callPublicFn("citizen-feedback", "generate-system-analytics-report", [], deployer);
      
      const { result } = simnet.callReadOnlyFn(
        "citizen-feedback",
        "get-system-analytics",
        [Cl.uint(1)],
        deployer
      );
      
      expect(result).toBeOk(Cl.some(Cl.tuple({
        "total-citizens": Cl.uint(expect.any(Number)),
        "total-proposals": Cl.uint(expect.any(Number)),
        "total-votes": Cl.uint(expect.any(Number)),
        "total-feedback": Cl.uint(expect.any(Number)),
        "active-proposals": Cl.uint(expect.any(Number)),
        "average-participation": Cl.uint(expect.any(Number)),
        "report-block": Cl.uint(expect.any(Number))
      })));
    });

    it("should retrieve latest analytics report", () => {
      // Generate report first
      simnet.callPublicFn("citizen-feedback", "generate-system-analytics-report", [], deployer);
      
      const { result } = simnet.callReadOnlyFn(
        "citizen-feedback",
        "get-latest-analytics-report",
        [],
        deployer
      );
      
      expect(result).toBeOk(Cl.some(Cl.tuple({
        "total-citizens": Cl.uint(expect.any(Number)),
        "total-proposals": Cl.uint(expect.any(Number)),
        "total-votes": Cl.uint(expect.any(Number)),
        "total-feedback": Cl.uint(expect.any(Number)),
        "active-proposals": Cl.uint(expect.any(Number)),
        "average-participation": Cl.uint(expect.any(Number)),
        "report-block": Cl.uint(expect.any(Number))
      })));
    });

    it("should handle no analytics data gracefully", () => {
      // Don't generate any reports
      const { result } = simnet.callReadOnlyFn(
        "citizen-feedback",
        "get-latest-analytics-report",
        [],
        deployer
      );
      
      expect(result).toBeErr(Cl.uint(115)); // ERR-NO-ANALYTICS-DATA
    });
  });

  describe("Category Management", () => {
    it("should allow admin to create categories", () => {
      const { result } = simnet.callPublicFn(
        "citizen-feedback",
        "create-category",
        [
          Cl.stringAscii("Infrastructure"),
          Cl.stringAscii("Projects related to city infrastructure")
        ],
        deployer
      );
      expect(result).toBeOk(Cl.uint(1));
    });

    it("should retrieve created categories", () => {
      // Create category first
      simnet.callPublicFn(
        "citizen-feedback",
        "create-category",
        [
          Cl.stringAscii("Environment"),
          Cl.stringAscii("Environmental initiatives and policies")
        ],
        deployer
      );

      const { result } = simnet.callReadOnlyFn(
        "citizen-feedback",
        "get-category",
        [Cl.uint(1)],
        deployer
      );
      
      expect(result).toBeOk(Cl.some(Cl.tuple({
        "name": Cl.stringAscii("Environment"),
        "description": Cl.stringAscii("Environmental initiatives and policies"),
        "active": Cl.bool(true)
      })));
    });
  });

  describe("Data Validation and Error Handling", () => {
    it("should reject unauthorized proposal creation", () => {
      const { result } = simnet.callPublicFn(
        "citizen-feedback",
        "create-proposal",
        [
          Cl.stringAscii("Unauthorized"),
          Cl.stringAscii("This should fail"),
          Cl.uint(100)
        ],
        wallet_1
      );
      expect(result).toBeErr(Cl.uint(100)); // ERR-NOT-AUTHORIZED
    });

    it("should reject votes from unregistered citizens", () => {
      // Create proposal without registering voter
      simnet.callPublicFn(
        "citizen-feedback",
        "create-proposal",
        [
          Cl.stringAscii("Test"),
          Cl.stringAscii("Test"),
          Cl.uint(100)
        ],
        deployer
      );

      const { result } = simnet.callPublicFn(
        "citizen-feedback",
        "submit-vote",
        [Cl.uint(1), Cl.bool(true)],
        wallet_1
      );
      expect(result).toBeErr(Cl.uint(102)); // ERR-NOT-REGISTERED
    });

    it("should reject duplicate votes", () => {
      // Register and setup
      simnet.callPublicFn("citizen-feedback", "register-citizen", [], wallet_1);
      simnet.callPublicFn(
        "citizen-feedback",
        "create-proposal",
        [Cl.stringAscii("Test"), Cl.stringAscii("Test"), Cl.uint(100)],
        deployer
      );

      // First vote
      simnet.callPublicFn("citizen-feedback", "submit-vote", [Cl.uint(1), Cl.bool(true)], wallet_1);
      
      // Second vote should fail
      const { result } = simnet.callPublicFn(
        "citizen-feedback",
        "submit-vote", 
        [Cl.uint(1), Cl.bool(false)], 
        wallet_1
      );
      expect(result).toBeErr(Cl.uint(104)); // ERR-ALREADY-VOTED
    });
  });
});
