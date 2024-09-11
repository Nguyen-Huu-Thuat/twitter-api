import { result, capitalize } from 'lodash'
import { TweetReqBody } from './../models/requests/Tweet.requests'
import { faker } from '@faker-js/faker'
import { ObjectId } from 'mongodb'
import { TweetAudience, TweetType, UserVerifyStatus } from '~/constants/enums'
import { RegisterReqBody } from '~/models/requests/User.requests'
import databaseService from '~/services/database.services'
import User from '~/models/schemas/User.schema'
import { hashPassword } from './crypto'
import tweetsService from '~/services/tweets.services'

const PASSWORD = 'Thuat@12345'
const MY_ID = new ObjectId('65800759846c65d842942a1b')
const USER_COUNT = 100

const createRandomUser = () => {
  const user: RegisterReqBody = {
    name: faker.internet.displayName(),
    email: faker.internet.email(),
    password: PASSWORD,
    confirm_password: PASSWORD,
    date_of_birth: faker.date.past().toISOString()
  }
  return user
}

const createRandomTweet = () => {
  const tweet: TweetReqBody = {
    type: TweetType.Tweet,
    audience: TweetAudience.Everyone,
    content: faker.lorem.paragraph({
      min: 10,
      max: 100
    }),
    parent_id: null,
    hashtags: [],
    mentions: [],
    medias: []
  }
  return tweet
}

const users: RegisterReqBody[] = faker.helpers.multiple(createRandomUser, {
  count: USER_COUNT
})

const insertMultipleUser = async (users: RegisterReqBody[]) => {
  console.log('Creating users...')
  const result = await Promise.all(
    users.map(async (user) => {
      const user_id = new ObjectId()
      await databaseService.users.insertOne(
        new User({
          ...user,
          username: `user${user_id.toString()}`,
          password: hashPassword(user.password),
          date_of_birth: new Date(user.date_of_birth),
          verify: UserVerifyStatus.Verified
        })
      )
      return user_id
    })
  )
  console.log(`Created ${result.length} users`)
  return result
}

const followMultipleUser = async (user_id: ObjectId, followed_user_ids: ObjectId[]) => {
  console.log('Following users...')
  const result = await Promise.all(
    followed_user_ids.map(async (followed_user_id) => {
      await databaseService.followers.insertOne({
        user_id,
        followed_user_id: followed_user_id,
        created_at: new Date()
      })
    })
  )
  console.log(`Followed ${result.length} users`)
}

const insertMultipleTweet = async (ids: ObjectId[]) => {
  console.log('Creating tweets...')
  console.log('Counting ...')

  let count = 0
  const result = await Promise.all(
    ids.map(async (id) => {
      await Promise.all([
        tweetsService.createTweet(id.toString(), createRandomTweet()),
        tweetsService.createTweet(id.toString(), createRandomTweet())
      ])
      count += 2
      console.log(`Created ${count} tweets`)
    })
  )
  return result
}

insertMultipleUser(users).then((ids) => {
  followMultipleUser(new ObjectId(MY_ID), ids)
  insertMultipleTweet(ids)
})
