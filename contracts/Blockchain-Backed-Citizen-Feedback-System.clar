(define-constant ERR-NOT-AUTHORIZED (err u100))
(define-constant ERR-ALREADY-REGISTERED (err u101))
(define-constant ERR-NOT-REGISTERED (err u102))
(define-constant ERR-INVALID-PROPOSAL (err u103))
(define-constant ERR-ALREADY-VOTED (err u104))
(define-constant ERR-PROPOSAL-EXPIRED (err u105))

(define-data-var admin principal tx-sender)
(define-data-var proposal-counter uint u0)

(define-map Citizens 
  principal 
  {registered: bool, feedback-count: uint}
)

(define-map Proposals
  uint 
  {
    title: (string-ascii 100),
    description: (string-ascii 500),
    creator: principal,
    start-block: uint,
    end-block: uint,
    yes-votes: uint,
    no-votes: uint,
    status: (string-ascii 20)
  }
)

(define-map CitizenVotes
  {proposal-id: uint, voter: principal}
  {voted: bool, vote: bool}
)

(define-map CitizenFeedback
  {proposal-id: uint, citizen: principal}
  {feedback: (string-ascii 500)}
)

(define-public (register-citizen)
  (let ((citizen tx-sender))
    (asserts! (is-none (map-get? Citizens citizen)) ERR-ALREADY-REGISTERED)
    (ok (map-set Citizens 
                citizen 
                {registered: true, feedback-count: u0}))))

(define-public (create-proposal (title (string-ascii 100)) 
                              (description (string-ascii 500))
                              (blocks-duration uint))
  (let ((new-id (+ (var-get proposal-counter) u1))
        (start stacks-block-height)
        (end (+ stacks-block-height blocks-duration)))
    (asserts! (is-eq tx-sender (var-get admin)) ERR-NOT-AUTHORIZED)
    (map-set Proposals new-id
      {
        title: title,
        description: description,
        creator: tx-sender,
        start-block: start,
        end-block: end,
        yes-votes: u0,
        no-votes: u0,
        status: "active"
      })
    (var-set proposal-counter new-id)
    (ok new-id)))

(define-public (submit-vote (proposal-id uint) (vote bool))
  (let ((citizen tx-sender)
        (proposal (unwrap! (map-get? Proposals proposal-id) ERR-INVALID-PROPOSAL))
        (vote-key {proposal-id: proposal-id, voter: citizen}))
    (asserts! (is-some (map-get? Citizens citizen)) ERR-NOT-REGISTERED)
    (asserts! (is-none (map-get? CitizenVotes vote-key)) ERR-ALREADY-VOTED)
    (asserts! (<= stacks-block-height (get end-block proposal)) ERR-PROPOSAL-EXPIRED)
    
    (map-set CitizenVotes vote-key {voted: true, vote: vote})
    (map-set Proposals proposal-id
      (merge proposal 
        {yes-votes: (if vote 
                      (+ (get yes-votes proposal) u1)
                      (get yes-votes proposal)),
         no-votes: (if (not vote)
                    (+ (get no-votes proposal) u1)
                    (get no-votes proposal))}))
    (ok true)))
(define-public (submit-feedback (proposal-id uint) (feedback (string-ascii 500)))
  (let ((citizen tx-sender)
        (feedback-key {proposal-id: proposal-id, citizen: citizen})
        (citizen-data (unwrap! (map-get? Citizens citizen) ERR-NOT-REGISTERED)))
    (asserts! (is-some (map-get? Proposals proposal-id)) ERR-INVALID-PROPOSAL)
    
    (map-set CitizenFeedback feedback-key {feedback: feedback})
    (map-set Citizens citizen 
      (merge citizen-data 
        {feedback-count: (+ (get feedback-count citizen-data) u1)}))
    (ok true)))
(define-read-only (get-proposal (proposal-id uint))
  (ok (map-get? Proposals proposal-id)))

(define-read-only (get-citizen-status (citizen principal))
  (ok (map-get? Citizens citizen)))

(define-read-only (get-vote-status (proposal-id uint) (voter principal))
  (ok (map-get? CitizenVotes {proposal-id: proposal-id, voter: voter})))

(define-read-only (get-feedback (proposal-id uint) (citizen principal))
  (ok (map-get? CitizenFeedback {proposal-id: proposal-id, citizen: citizen})))

(define-constant ERR-INVALID-CATEGORY (err u106))

(define-data-var category-counter uint u0)

(define-map Categories
  uint
  {
    name: (string-ascii 50),
    description: (string-ascii 200),
    active: bool
  }
)

(define-map ProposalCategories
  uint
  {category-id: uint}
)

(define-map CategoryProposals
  {category-id: uint, proposal-id: uint}
  {assigned: bool}
)

(define-public (create-category (name (string-ascii 50)) (description (string-ascii 200)))
  (let ((new-category-id (+ (var-get category-counter) u1)))
    (asserts! (is-eq tx-sender (var-get admin)) ERR-NOT-AUTHORIZED)
    (map-set Categories new-category-id
      {
        name: name,
        description: description,
        active: true
      })
    (var-set category-counter new-category-id)
    (ok new-category-id)))

(define-public (assign-proposal-category (proposal-id uint) (category-id uint))
  (let ((proposal (unwrap! (map-get? Proposals proposal-id) ERR-INVALID-PROPOSAL))
        (category (unwrap! (map-get? Categories category-id) ERR-INVALID-CATEGORY)))
    (asserts! (is-eq tx-sender (var-get admin)) ERR-NOT-AUTHORIZED)
    (asserts! (get active category) ERR-INVALID-CATEGORY)
    
    (map-set ProposalCategories proposal-id {category-id: category-id})
    (map-set CategoryProposals {category-id: category-id, proposal-id: proposal-id} {assigned: true})
    (ok true)))

(define-read-only (get-category (category-id uint))
  (ok (map-get? Categories category-id)))

(define-read-only (get-proposal-category (proposal-id uint))
  (ok (map-get? ProposalCategories proposal-id)))

(define-read-only (is-proposal-in-category (category-id uint) (proposal-id uint))
  (ok (map-get? CategoryProposals {category-id: category-id, proposal-id: proposal-id})))

  (define-constant VOTE-REPUTATION-REWARD u10)
(define-constant FEEDBACK-REPUTATION-REWARD u5)
(define-constant MAX-VOTE-WEIGHT u5)

(define-map CitizenReputation
  principal
  {
    reputation-points: uint,
    vote-weight: uint,
    last-activity-block: uint
  }
)

(define-map WeightedProposalVotes
  uint
  {
    weighted-yes-votes: uint,
    weighted-no-votes: uint
  }
)

(define-private (calculate-vote-weight (reputation-points uint))
  (let ((weight (/ reputation-points u100)))
    (if (> weight MAX-VOTE-WEIGHT)
        MAX-VOTE-WEIGHT
        (if (< weight u1) u1 weight))))

(define-private (update-citizen-reputation (citizen principal) (points-to-add uint))
  (let ((current-rep (default-to {reputation-points: u0, vote-weight: u1, last-activity-block: u0}
                                 (map-get? CitizenReputation citizen)))
        (new-points (+ (get reputation-points current-rep) points-to-add))
        (new-weight (calculate-vote-weight new-points)))
    (map-set CitizenReputation citizen
      {
        reputation-points: new-points,
        vote-weight: new-weight,
        last-activity-block: stacks-block-height
      })
    new-weight))

(define-public (submit-weighted-vote (proposal-id uint) (vote bool))
  (let ((citizen tx-sender)
        (proposal (unwrap! (map-get? Proposals proposal-id) ERR-INVALID-PROPOSAL))
        (vote-key {proposal-id: proposal-id, voter: citizen})
        (vote-weight (update-citizen-reputation citizen VOTE-REPUTATION-REWARD))
        (current-weighted (default-to {weighted-yes-votes: u0, weighted-no-votes: u0}
                                     (map-get? WeightedProposalVotes proposal-id))))
    (asserts! (is-some (map-get? Citizens citizen)) ERR-NOT-REGISTERED)
    (asserts! (is-none (map-get? CitizenVotes vote-key)) ERR-ALREADY-VOTED)
    (asserts! (<= stacks-block-height (get end-block proposal)) ERR-PROPOSAL-EXPIRED)
    
    (map-set CitizenVotes vote-key {voted: true, vote: vote})
    (map-set Proposals proposal-id
      (merge proposal 
        {yes-votes: (if vote 
                      (+ (get yes-votes proposal) u1)
                      (get yes-votes proposal)),
         no-votes: (if (not vote)
                    (+ (get no-votes proposal) u1)
                    (get no-votes proposal))}))
    (map-set WeightedProposalVotes proposal-id
      {
        weighted-yes-votes: (if vote
                              (+ (get weighted-yes-votes current-weighted) vote-weight)
                              (get weighted-yes-votes current-weighted)),
        weighted-no-votes: (if (not vote)
                             (+ (get weighted-no-votes current-weighted) vote-weight)
                             (get weighted-no-votes current-weighted))
      })
    (ok true)))

(define-public (submit-reputation-feedback (proposal-id uint) (feedback (string-ascii 500)))
  (let ((citizen tx-sender)
        (feedback-key {proposal-id: proposal-id, citizen: citizen})
        (citizen-data (unwrap! (map-get? Citizens citizen) ERR-NOT-REGISTERED)))
    (asserts! (is-some (map-get? Proposals proposal-id)) ERR-INVALID-PROPOSAL)
    
    (update-citizen-reputation citizen FEEDBACK-REPUTATION-REWARD)
    (map-set CitizenFeedback feedback-key {feedback: feedback})
    (map-set Citizens citizen 
      (merge citizen-data 
        {feedback-count: (+ (get feedback-count citizen-data) u1)}))
    (ok true)))

(define-read-only (get-citizen-reputation (citizen principal))
  (ok (map-get? CitizenReputation citizen)))

(define-read-only (get-weighted-votes (proposal-id uint))
  (ok (map-get? WeightedProposalVotes proposal-id)))