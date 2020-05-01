const DB_NAME = 'extension-youtube-subtitle-translator'
const DB_VERSION = 1
const WORD_STORE_NAME = 'wordNote'
let DB = null

const firstDbOpenReq = indexedDB.open(DB_NAME, DB_VERSION)

firstDbOpenReq.onupgradeneeded = function(event){
  const db = event.target.result;
  db.createObjectStore(WORD_STORE_NAME, {keyPath : 'word'})
}
firstDbOpenReq.onsuccess = function(event){
  DB = event.target.result;
}


function addWordNote(word, mean, sentence){
  const nowDate = new Date()
  const registerYMD = nowDate.getFullYear() + '/' + ( nowDate.getMonth() + 1 ) + '/' + nowDate.getDate()

  const readTrans = DB.transaction(WORD_STORE_NAME, 'readonly')
  const readStore = readTrans.objectStore(WORD_STORE_NAME)
  const getWordReq = readStore.get(word)
  getWordReq.onsuccess = function(e){
    const saveValue = {
      word: word,
      sentence: sentence,
      time: 1,
      date: registerYMD,
      utc: nowDate.getTime(),
      mean: mean
    }
    if(event.target.result){
      saveValue.time = event.target.result.time + 1 
    }
    const writeTrans = DB.transaction(WORD_STORE_NAME, 'readwrite')
    const writeStore = writeTrans.objectStore(WORD_STORE_NAME)
    const putReq = writeStore.put(saveValue)
    putReq.onsuccess = function(){
      // console.log('put data success')
    }
  }
}



chrome.runtime.onMessage.addListener(function(message) {
  if(message.flag === 'addWordNote'){
    addWordNote(message.data.word, message.data.mean, message.data.sentence)
  }
});