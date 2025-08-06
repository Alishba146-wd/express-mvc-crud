import { getDB } from '../config/db.js';
import { ObjectId } from 'mongodb';

export async function getAllUsers() {
  return await getDB().collection('users').find().toArray();
}

export async function getUserById(id) {
  return await getDB().collection('users').findOne({ _id: new ObjectId(id) });
}

export async function createUser(data) {
  return await getDB().collection('users').insertOne(data);
}

export async function updateUser(id, data) {
  return await getDB().collection('users').updateOne(
    { _id: new ObjectId(id) },
    { $set: data }
  );
}

export async function deleteUser(id) {
  return await getDB().collection('users').deleteOne({ _id: new ObjectId(id) });
}
