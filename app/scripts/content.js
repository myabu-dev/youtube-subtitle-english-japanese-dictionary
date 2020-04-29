import Lemmatizer from '../javascript-lemmatizer/js/lemmatizer.js'
import Ejdc from '../ejdc-hand/ejdc-hand.js'
import {JSFrame} from 'jsframe';
const lemmatizer = new Lemmatizer()

const TIMEOUT_DULATION = 300;
const CLONE_CAPTION_WINDOW_ID = 'extension-clone-caption-window'
const ENG_WORD_SPAN_CLASS = 'extension-word-span'
const WOED_SPAN_DATA_ATTRIBUTE = 'extension-word-data'

// const DB_NAME = 'extension-youtube-subtitle-translator'
// const DB_VERSION = 1
// const WORD_STORE_NAME = 'wordNote'
// let DB = null

const WHITLIST_CHARS = [
  "'", "’", '.'
]
const jsFrame = new JSFrame()

// const firstDbOpenReq = indexedDB.open(DB_NAME, DB_VERSION)

// firstDbOpenReq.onupgradeneeded = function(event){
//   const db = event.target.result;
//   db.createObjectStore(WORD_STORE_NAME, {keyPath : 'word'})
// }
// firstDbOpenReq.onsuccess = function(event){
//   DB = event.target.result;
// }

const wordFrame = jsFrame.create({
  title: 'Youtube Subtitle Translator',
  left: 20 + (320 + 20), top: 50, width: 320, height: 220, minWidth: 200, minHeight: 110,
  appearanceName: 'redstone',
  style: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    overflow: 'auto'
  }
})
wordFrame.hideFrameComponent('minimizeButton');
wordFrame.hideFrameComponent('maximizeButton');
wordFrame.titleBarColorFocused = '#80DEEA'

wordFrame.htmlElement.parentElement.parentElement.style.zIndex = 99999

wordFrame.on('closeButton', 'click', (_wordFrame, evt) => {
  const yVideo = document.getElementsByTagName('video')
  if(yVideo){
    yVideo[0].play()
  }
  _wordFrame.hide()
});

function addWord(word, mean, sentence){
  chrome.runtime.sendMessage(
    { flag: 'addWordNote', data:{ word: word, mean: mean, sentence: sentence} }
  )
}

function getFloatingWindowHtml(wordMeanList, sentence){
  const retHtml = document.createElement('div')
  retHtml.style.cssText = 'padding:10px 5px; font-size:1.5rem;'

  for(const [wordIndex, wordMean] of wordMeanList.entries()){
    if(wordIndex !== 0){
      const double_hr = document.createElement('hr')
      double_hr.style.cssText = 'border-top: 3px double #bbb; margin: 10px 0px;' 
      retHtml.appendChild(double_hr)
    }
    const word = wordMean.word

    const wordContainer = document.createElement('div')
    wordContainer.style.cssText = 'display:inline-flex;　align-items: center;'

    const wordElm = document.createElement('span')
    wordElm.style.cssText = 'padding-left:5px; color:#0D47A1;'
    wordElm.innerHTML = word
    wordContainer.appendChild(wordElm)

    const wordAddBtn = document.createElement('button')
    wordAddBtn.style.cssText = 'color: #EF6C00; border: solid 1px #EF6C00; border-radius: 3px; font-size:1.0rem; margin-left:10px;'
    wordAddBtn.innerHTML = chrome.i18n.getMessage('addButtonRegister')
    wordAddBtn.onclick = function(e){
      e.currentTarget.style.color = '#B0BEC5'
      e.currentTarget.style.borderColor = '#B0BEC5'
      e.currentTarget.innerHTML = chrome.i18n.getMessage('addButtonComplete')
      e.currentTarget.disabled = true;
      addWord(word, wordMean.mean, sentence)
    }
    wordContainer.appendChild(wordAddBtn)

    retHtml.appendChild(wordContainer)

    const single_hr = document.createElement('hr')
    single_hr.style.cssText = 'border-top: 1px solid #bbb; margin: 5px 0px;' 
    retHtml.appendChild(single_hr)

    for(let [meanIndex, mean] of wordMean.mean.entries()){
      mean = mean.replace(/[《(]/g, '<span style="color:#43A047;">$&') 
      mean = mean.replace(/[》)]/g,'$&</span>')
      if(wordMean.mean.length > 1){
        const meanContainer = document.createElement('div')
        meanContainer.style.cssText = 'font-size:1.2rem; display:flex;　align-items: baseline;'

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
  }

  return retHtml
}


function isAlphabetOrNum(str){
  if(str){
    return /^[A-Za-z0-9]*$/.test(str)
  }else{
    return false
  }
}

window.setTimeout(setTitleObserver, TIMEOUT_DULATION)


function setTitleObserver(){
  console.log('observer')
  const title = document.querySelector('title')
  
  if(title == null){
    window.setTimeout(setTitleObserver, TIMEOUT_DULATION)
    return
  }

  titleObserver.observe(title,{
    subtree: true, characterData: true, childList: true
  })
}

const titleObserver = new MutationObserver( () => {
  captionObserver.disconnect()
  console.log('title change')
  removeCloneCaption()
  setCaptionObserver()
})



function setCaptionObserver(){
  const captionWindow = document.querySelector('div[id*="caption-window"]')
  if(captionWindow === null) {
    window.setTimeout(setCaptionObserver, TIMEOUT_DULATION)
    return
  }

  if(captionWindow.getAttribute('draggable') !== 'true'){
    console.log('not drag')
    window.setTimeout(setCaptionObserver, TIMEOUT_DULATION)
    return
  }

  captionObserver.observe(captionWindow.parentElement.parentElement, {
    childList: true,
    subtree: true
  })
}




function removeCloneCaption(){
  const clone = document.getElementById(CLONE_CAPTION_WINDOW_ID)
  if(clone){
    clone.remove()
  }
}

function addCloneCaption(original){
  if(!original) return

  const clone = original.cloneNode(true)
  clone.id = CLONE_CAPTION_WINDOW_ID
  original.parentElement.appendChild(clone)
}

function getCloneCaption(){
  return document.getElementById(CLONE_CAPTION_WINDOW_ID)
}

function getMeaningList(word, sentence){
  const wordMeanList = []
  let firstWordList = []
  let secondWordList = []

  if(sentence.indexOf(word) < 2 && word !== 'I'){ //文頭が" or 'のときがあるため2
    firstWordList = lemmatizer.only_lemmas(word.toLowerCase())
    secondWordList = [word]
  }else{
    firstWordList = [word]
    secondWordList = lemmatizer.only_lemmas(word.toLowerCase())
  }

  for(const firstWord of firstWordList){
    let mean = Ejdc[firstWord]
    if(mean){
      if(!Array.isArray(mean)){
        mean = [mean]
      }
      wordMeanList.push({word: firstWord, mean: mean})
    }
  }

  for(const secondWord of secondWordList){
    if(firstWordList.includes(secondWord)){
      continue
    }

    let mean = Ejdc[secondWord]
    if(mean){
      if(!Array.isArray(mean)){
        mean = [mean]
      }
      wordMeanList.push({word: secondWord, mean: mean})
    }
  }

  return wordMeanList
}

function clickWordEvent(word, sentence){
  const yVideo = document.getElementsByTagName('video')
  if(yVideo){
    yVideo[0].pause()
  }
  const meanList = getMeaningList(word, sentence)
  wordFrame.getFrameView().innerHTML = ''
  wordFrame.getFrameView().appendChild(getFloatingWindowHtml(meanList, sentence))
  wordFrame.show()
}

const captionObserver = new MutationObserver( () => {
  removeCloneCaption()

  let captionWindow = document.querySelectorAll('div[id*="caption-window"][draggable="true"]')
  if(captionWindow.length === 0){
    console.log('none')
    return;
  }

  // for(const line of captionWindow){
  //   if(line.getAttribute('lang') && line.getAttribute('draggable') === 'true'){
  //     console.log('auto generated')
  //     return
  //   }
  // }

  captionObserver.disconnect();

  if(captionWindow.length > 1){
    captionWindow[0].remove()
    captionWindow = captionWindow[1]
  }else{
    captionWindow = captionWindow[0]
  }



  captionWindow.style.display = 'block'

  addCloneCaption(captionWindow)

  captionWindow.style.display = 'none'


  const captionList = getCloneCaption().querySelectorAll('span > span > span')
  for(const line of captionList){
    const text = line.textContent
    if(text === null)continue;

    line.innerHTML = null
    // const separator = /(?<=\s+|\W|_)/ //split with sepalator char
    const separator = /([^a-zA-Z_0-9\.\’\']+|\.\.\.|\.\.|'')/
    const wordList = text.split(separator)
    // console.log(wordList)
    let newInnerHTML = ''
    for(const word of wordList){
      let validWord = ''
      let colonCounter = 0
      for(const char of word){
        if(isAlphabetOrNum(char) || WHITLIST_CHARS.includes(char)){
          validWord += char
          if(char === '.'){
            colonCounter ++
          }
        }
      }

      if(validWord[validWord.length-1] === '.'){
        validWord = validWord.slice(0, -1)
      }
      
      // console.log(validWord)
      const wordSpanElm = document.createElement('span')
      wordSpanElm.innerHTML = validWord
      wordSpanElm.style.color = 'red'
      wordSpanElm.className = ENG_WORD_SPAN_CLASS
      wordSpanElm.setAttribute(WOED_SPAN_DATA_ATTRIBUTE, text);
      // wordSpanElm.style.textDecoration = 'underline'
      const replaced = wordSpanElm.outerHTML
      if(word.length === colonCounter){
        newInnerHTML += word
      }else{
        newInnerHTML += word.replace(validWord, replaced)
      }
    }
    line.innerHTML = newInnerHTML
  }

  const spanList = document.querySelectorAll('.'+ENG_WORD_SPAN_CLASS)
  for(const span of spanList){
    span.onclick = ()=>{clickWordEvent(span.textContent.replace(/’/g,"'"), span.getAttribute(WOED_SPAN_DATA_ATTRIBUTE))}
  }


  const captionContent = document.querySelectorAll('div[id*="caption-window"][draggable="true"] span span span')

  captionObserver.observe(captionWindow.parentElement.parentElement, {
    childList: true,
    subtree: true
  })

  // console.log(captionContent)
  // for(const line of captionContent){
  //   if(line.textContent === null) continue;
  //   console.log(line.textContent)
  // }


})

