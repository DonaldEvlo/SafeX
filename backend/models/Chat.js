class Chat {
  constructor({ id, participants = [], lastMessage = '', updatedAt = null }) {
    this.id = id
    this.participants = participants // array of user UIDs
    this.lastMessage = lastMessage
    this.updatedAt = updatedAt
  }

  static fromJson(json) {
    if (!json) return null
    return new Chat({
      id: json.id,
      participants: json.participants,
      lastMessage: json.lastMessage,
      updatedAt: json.updatedAt
    })
  }

  toJson() {
    return {
      id: this.id,
      participants: this.participants,
      lastMessage: this.lastMessage,
      updatedAt: this.updatedAt
    }
  }
}

module.exports = Chat
