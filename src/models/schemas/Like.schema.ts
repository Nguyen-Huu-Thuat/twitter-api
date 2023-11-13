import { ObjectId } from 'mongodb'

interface LikeType {
  _id?: ObjectId
  user_id: ObjectId
  created_at?: Date
  tweet_id: ObjectId
}

export default class Like {
  _id: ObjectId
  user_id: ObjectId
  tweet_id: ObjectId
  created_at?: Date

  constructor({ _id, created_at, tweet_id, user_id }: LikeType) {
    this._id = _id || new ObjectId()
    this.user_id = user_id
    this.tweet_id = tweet_id
    this.created_at = created_at || new Date()
  }
}
