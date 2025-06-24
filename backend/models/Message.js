class Message {
  constructor({ id, senderId, text, timestamp = null }) {
    this.id = id
    this.senderId = senderId
    this.text = text
    this.timestamp = timestamp
  }

  static fromJson(json) {
    if (!json) return null
    return new Message({
      id: json.id,
      senderId: json.senderId,
      text: json.text,
      timestamp: json.timestamp
    })
  }

  toJson() {
    return {
      id: this.id,
      senderId: this.senderId,
      text: this.text,
      timestamp: this.timestamp
    }
  }
}

module.exports = Message
