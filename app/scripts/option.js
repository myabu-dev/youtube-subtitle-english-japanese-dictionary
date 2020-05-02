import {JSFrame} from 'jsframe'
const jsFrame = new JSFrame()

const DB_NAME = 'extension-youtube-subtitle-translator'
const DB_VERSION = 1
const WORD_STORE_NAME = 'wordNote'

const firstDbOpenReq = indexedDB.open(DB_NAME, DB_VERSION)

firstDbOpenReq.onsuccess = function(event){
  const DB = event.target.result
  const getWordNoteAllRequest = DB.transaction(WORD_STORE_NAME, "readonly").objectStore(WORD_STORE_NAME).getAll()
  getWordNoteAllRequest.onsuccess = function(event){
    console.log(event.target.result)
    initPage(event.target.result)
    DB.close()
  }
}

const sortSelect = document.getElementById('word-sort-select')
sortSelect.addEventListener('change', (event) => {
  const openReq = indexedDB.open(DB_NAME, DB_VERSION)

  openReq.onsuccess = function(event){
    const DB = event.target.result
    const getWordNoteAllRequest = DB.transaction(WORD_STORE_NAME, "readonly").objectStore(WORD_STORE_NAME).getAll()
    getWordNoteAllRequest.onsuccess = function(event){
      renderTable(event.target.result, sortSelect.value)
      DB.close()
    }
  }
})

const wordFrameWidth = Math.max(window.innerWidth / 5, 320)
const wordFrameHeight = Math.max(wordFrameWidth * 3 / 5, 240)
const wordFrame = jsFrame.create({
  name: 'word-note-window',
  title: 'Youtube字幕 英和辞典',
  left: Math.min(window.innerWidth - wordFrameWidth - 100, window.innerWidth / 2 - wordFrameWidth / 2),
  top: Math.min(wordFrameHeight * 2, window.innerHeight / 2 - wordFrameHeight / 2),
  width: wordFrameWidth,
  height: wordFrameHeight,
  minWidth: 200,
  minHeight: 110,
  appearanceName: 'redstone',
  style: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    overflow: 'auto'
  }
})

wordFrame.hideFrameComponent('minimizeButton')
wordFrame.hideFrameComponent('maximizeButton')

wordFrame.on('closeButton', 'click', (_wordFrame, evt) => {
  _wordFrame.hide()
})


function initPage(noteData){
  if(noteData.length === 0){
    document.getElementById('word-table').style.display = 'none'
    document.getElementById('word-note-empty').style.display = 'block'
  }

  renderTable(noteData)
}

function deleteWord(word){
  if(document.getElementById('check-delete-checkbox').checked){
    const userCheck = confirm(`${word} を削除します`)
    if(!userCheck)return
  }

  const openReq = indexedDB.open(DB_NAME, DB_VERSION)

  openReq.onsuccess = function(event){
    const DB = event.target.result
    const deleteWordReq = DB.transaction(WORD_STORE_NAME, "readwrite").objectStore(WORD_STORE_NAME).delete(word)
    deleteWordReq.onsuccess = function(){
      const getWordNoteAllRequest = DB.transaction(WORD_STORE_NAME, "readonly").objectStore(WORD_STORE_NAME).getAll()
      getWordNoteAllRequest.onsuccess = function(event){
        renderTable(event.target.result, sortSelect.value)
        DB.close()
      }
    }
  }
}

function compareDayUp(a, b){
  if(a.utc<b.utc) return -1;
  if(a.utc>b.utc) return 1;
  return 0;
}

function compareWordUp(a, b){
  if(a.word<b.word) return -1;
  if(a.word>b.word) return 1;
  return 0;
}

function compareTimeUp(a, b){
  if(a.time<b.time) return -1;
  if(a.time>b.time) return 1;

  if(a.word<b.utc) return -1;
  if(a.word>b.utc) return 1;
  return 0;
}

function getFloatingWindowHtml(word, mean){
  const retHtml = document.createElement('div')
  retHtml.style.cssText = 'padding:10px 5px; font-size:1.1rem;'

  const wordElm = document.createElement('span')
  wordElm.style.cssText = 'padding-left:5px; color:#0D47A1;'
  wordElm.innerHTML = word

  retHtml.appendChild(wordElm)

  const single_hr = document.createElement('hr')
  single_hr.style.cssText = 'border-top: 1px solid #bbb; margin: 5px 0px;' 
  retHtml.appendChild(single_hr)

  for(let [meanIndex, mean] of mean.entries()){
    mean = mean.replace(/[《(]/g, '<span style="color:#43A047;">$&') 
    mean = mean.replace(/[》)]/g,'$&</span>')
    if(mean.length > 1){
      const meanContainer = document.createElement('div')
      meanContainer.style.cssText = 'font-size:0.8rem; display:flex;　align-items: baseline;'

      const meanNumber = document.createElement('div')
      meanNumber.style.cssText = 'padding-left:5px; font-weight:bold'
      meanIndex += 1
      meanNumber.innerHTML = `${meanIndex}.&nbsp;`

      const meanBody = document.createElement('div')
      meanBody.innerHTML = mean

      meanContainer.appendChild(meanNumber)
      meanContainer.appendChild(meanBody)
      
      retHtml.appendChild(meanContainer)
    }else{
      const meanBody = document.createElement('div')
      meanBody.style.cssText = 'padding-left:5px; font-size:1.2rem;'
      meanBody.innerHTML = mean
      retHtml.appendChild(meanBody)
    }
    
  }

  return retHtml
}

function showWordMean(word, mean){
  wordFrame.getFrameView().innerHTML = ''
  wordFrame.getFrameView().appendChild(getFloatingWindowHtml(word, mean))

  const windowSize = wordFrame.getSize()
  const windowPositoin = wordFrame.getPosition()
  if(window.innerWidth < (windowPositoin.x + windowSize.width)){
    const new_x = window.innerWidth - windowSize.width - 20
    wordFrame.setPosition(new_x, windowPositoin.y, 'LEFT_TOP')
  }else if(windowPositoin.x - windowSize.width < 0){
    const new_x = 20
    wordFrame.setPosition(new_x, windowPositoin.y, 'LEFT_TOP')
  }

  if(window.innerHeight < (windowPositoin.y + windowSize.height)){
    const new_y = window.innerHeight - windowSize.height - 20
    wordFrame.setPosition(wordFrame.getPosition().x, new_y, 'LEFT_TOP')
  }else if(windowPositoin.y - windowSize.height < 0){
    const new_y = 50
    wordFrame.setPosition(wordFrame.getPosition().x, new_y, 'LEFT_TOP')
  }

  wordFrame.show()
}

function getCsvContent(tableData){
  let retCsv = '単語,意味,使用されていた文,登録回数,登録日\n'
  for(const wordData of tableData){
    let meanText = '"'
    for(const [meanIndex, mean] of wordData.mean.entries()){
      let number = null
      if(mean.length > 1){
        number = (meanIndex + 1) + '. '
      }
      if(meanIndex === 0){
        meanText += number + mean
      }else{
        meanText += `\n${number}${mean}`
      }
    }
    meanText += '"'
    retCsv += `${wordData.word},${meanText},${wordData.sentence},${wordData.time},${wordData.date}\n`
  }
  return retCsv
}

function setCsvData(tableData){
  const bom = new Uint8Array([0xEF, 0xBB, 0xBF])
  const csvData = getCsvContent(tableData)
  const wordNoteBlob = new Blob([bom, csvData], { "type" : "text/csv" })
  const csvDownload = document.getElementById('csv-download')
  csvDownload.href = window.URL.createObjectURL(wordNoteBlob)
}

function renderTable(noteData, order='dayDown'){
  if(order==='dayUp'){
    noteData = noteData.sort(compareDayUp)
  }else if(order==='dayDown'){
    noteData = noteData.sort(compareDayUp)
    noteData = noteData.reverse()
  }else if(order==='wordUp'){
    noteData = noteData.sort(compareWordUp)
  }else if(order==='wordDown'){
    noteData = noteData.sort(compareWordUp)
    noteData = noteData.reverse()
  }else if(order==='timeUp'){
    noteData = noteData.sort(compareTimeUp)
  }else{
    noteData = noteData.sort(compareTimeUp)
    noteData = noteData.reverse()
  }
  setCsvData(noteData)

  if(noteData.length === 0){
    document.getElementById('word-table').style.display = 'none'
    document.getElementById('word-note-empty').style.display = 'block'
  }else{
    document.getElementById('word-table').style.display = 'table'
    document.getElementById('word-note-empty').style.display = 'none'
  }
  
  const tBody = document.getElementById('word-table-body')
  tBody.innerHTML = ''
  
  for(const wordData of noteData){
    const tableLine = document.createElement('tr')

    // const checkBoxTd = document.createElement('td')
    // const checkBox = document.createElement('input')
    // checkBox.className = 'word-chx-box'
    // checkBox.type = 'checkbox'
    // checkBoxTd.appendChild(checkBox)
    // tableLine.appendChild(checkBoxTd)
    const deleteTd = document.createElement('td')
    const deleteBtn = document.createElement('button')
    deleteBtn.innerHTML = '削除'
    deleteBtn.className = 'btn-flat-border-red'
    deleteBtn.onclick = ()=>{deleteWord(wordData.word)}
    deleteTd.appendChild(deleteBtn)
    tableLine.appendChild(deleteTd)

    const wordTd = document.createElement('td')
    wordTd.innerHTML = wordData.word
    tableLine.appendChild(wordTd)

    if(wordData.mean.length > 0){
      const meanTd = document.createElement('td')
      const meanBtn = document.createElement('button')
      meanBtn.innerHTML = '意味を見る'
      meanBtn.className = 'btn-flat-border-mean'
      meanBtn.onclick = ()=>{showWordMean(wordData.word, wordData.mean)}
      meanTd.appendChild(meanBtn)
      tableLine.appendChild(meanTd)
    }else{
      const meanTd = document.createElement('td')
      meanTd.innerHTML = '辞書にない単語です'
      tableLine.appendChild(meanTd)
    }

    const sentenceTd = document.createElement('td')
    sentenceTd.innerHTML = wordData.sentence
    tableLine.appendChild(sentenceTd)

    const timeTd = document.createElement('td')
    timeTd.innerHTML = wordData.time + '回'
    tableLine.appendChild(timeTd)

    const dateTd = document.createElement('td')
    dateTd.innerHTML = wordData.date
    tableLine.appendChild(dateTd)

    tBody.appendChild(tableLine)
  }

}