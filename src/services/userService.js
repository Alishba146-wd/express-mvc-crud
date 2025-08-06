const { getDB } = require('../config/db');
const { ObjectId } = require('mongodb');

async function getAllUsers() {
  return await getDB().collection('users').find().toArray();
}

async function getUserById(id) {
  return await getDB().collection('users').findOne({ _id: new ObjectId(id) });
}

async function createUser(data) {
  return await getDB().collection('users').insertOne(data);
}

async function updateUser(id, data) {
  return await getDB().collection('users').updateOne(
    { _id: new ObjectId(id) },
    { $set: data }
  );
}

async function deleteUser(id) {
  return await getDB().collection('users').deleteOne({ _id: new ObjectId(id) });
}

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser
};
