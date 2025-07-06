# 🗳️ Blockchain-Backed Citizen Feedback System

A decentralized platform for transparent citizen feedback and voting on government policies.

## 🎯 Features

- ✨ Anonymous yet verifiable citizen registration
- 📊 Proposal creation by authorized administrators
- 🗽 Secure one-person-one-vote system
- 💭 Feedback submission on proposals
- 🔍 Transparent audit trail of all activities

## 🚀 Smart Contract Functions

### For Citizens
- `register-citizen`: Register as a verified citizen
- `submit-vote`: Cast vote on active proposals
- `submit-feedback`: Provide feedback on proposals

### For Administrators
- `create-proposal`: Create new policy proposals

### Read-Only Functions
- `get-proposal`: View proposal details
- `get-citizen-status`: Check citizen registration status
- `get-vote-status`: View voting status
- `get-feedback`: Access submitted feedback

## 💻 Usage Example

```clarity
;; Register as a citizen
(contract-call? .citizen-feedback register-citizen)

;; Submit vote on proposal #1 (true = yes, false = no)
(contract-call? .citizen-feedback submit-vote u1 true)

;; Submit feedback on proposal #1
(contract-call? .citizen-feedback submit-feedback u1 "Great initiative!")
```

## 🔒 Security Features

- Non-transferable citizen registration
- One vote per proposal per citizen
- Immutable voting and feedback records
- Time-bound proposal voting periods

## 🤝 Contributing

Feel free to submit issues and enhancement requests!
```
