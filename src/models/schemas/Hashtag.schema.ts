import { ObjectId } from 'mongodb'

interface HashtagType {
  _id?: ObjectId
  created_at?: Date
  name: string
}

export default class Hashtag {
  _id?: ObjectId
  created_at: Date
  name: string

  constructor({ _id, created_at, name }: HashtagType) {
    this._id = _id || new ObjectId()
    this.name = name
    this.created_at = created_at || new Date()
  }
}
