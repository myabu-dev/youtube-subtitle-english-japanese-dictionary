import Lemmatizer from '../javascript-lemmatizer/js/lemmatizer.js'
import {JSFrame} from 'jsframe'
import Swiper from 'swiper';

const lemmatizer = new Lemmatizer()

const TIMEOUT_DULATION = 300;
const CLONE_CAPTION_WINDOW_ID = 'extension-clone-caption-window'
const ENG_WORD_SPAN_CLASS = 'extension-word-span'
const WOED_SPAN_DATA_ATTRIBUTE = 'extension-word-data'

let Ejdc = null
const ejdcHandUrl = chrome.runtime.getURL('ejdc-hand.json');
fetch(ejdcHandUrl).then((response) => response.json()).then((json) => Ejdc = json)

const WHITLIST_CHARS = [
  "'", "’", '.'
]
const jsFrame = new JSFrame()

let WORD_CLICK_STOP_VIDEO_FLAG = true
let WORD_CLOSE_START_VIDEO_FLAG = true

chrome.runtime.onMessage.addListener(function(message) {
  if(message.flag === 'loadSetting'){
    loadSetting()
    // console.log('load setting')
  }
})

loadSetting()

window.setTimeout(setTitleObserver, TIMEOUT_DULATION)

function loadSetting(){
  chrome.storage.local.get(["word_click_stop", "word_close_start", "first_flag"], function (result) {
    if(result.word_click_stop != null){
      WORD_CLICK_STOP_VIDEO_FLAG = result.word_click_stop;
    }
    if(result.word_close_start != null){
      WORD_CLOSE_START_VIDEO_FLAG = result.word_close_start;
    }

    if(result.first_flag == null){
      showHowToUse()
    }
  })
}

function showHowToUse(){
  const frameWidth = window.innerWidth / 2
  const frameHeight = window.innerWidth / 2 * 9 / 16
  const howToUseWindow = jsFrame.create({
    name: 'howto-use-widow',
    title: 'YouTube字幕 英和辞典 の使い方',
    left: frameWidth / 2,
    top: frameHeight / 2,
    width: frameWidth,
    height: frameHeight,
    movable: true,
    resizable: false,
    appearanceName: 'redstone',
    style: {
      backgroundColor: 'rgba(255,255,255,0.95)',
      overflow: 'auto'
    }
  })
  howToUseWindow.hideFrameComponent('minimizeButton')
  howToUseWindow.hideFrameComponent('maximizeButton')

  howToUseWindow.htmlElement.parentElement.parentElement.style.zIndex = 99999

  howToUseWindow.getFrameView().appendChild(getHowToUseHtml())
  howToUseWindow.show()

  howToUseWindow.on('closeButton', 'click', (_howtoFrame, evt) => {
    chrome.storage.local.set({'first_flag': 'first'})
    _howtoFrame.closeFrame()
  });

  const swiper = new Swiper('.swiper-container', {
    pagination: {
      el: '.swiper-pagination',
    },
    navigation: {
      nextEl: '.swiper-button-next',
      prevEl: '.swiper-button-prev',
    }
  })
}


function getHowToUseHtml(){
  const container = document.createElement('div')
  container.style.height = '100%'
  container.style.width = '100%'
  container.className = 'swiper-container'

  const wrapper = document.createElement('div')
  wrapper.className = 'swiper-wrapper'
  container.appendChild(wrapper)

  const div1 = document.createElement('div')
  const img1 = document.createElement('img')
  img1.src = chrome.extension.getURL('images/howto_1.svg')
  div1.className = 'swiper-slide'
  div1.appendChild(img1)
  wrapper.appendChild(div1)

  const div2 = document.createElement('div')
  const img2 = document.createElement('img')
  img2.src = chrome.extension.getURL('images/howto_2.svg')
  div2.className = 'swiper-slide'
  div2.appendChild(img2)
  wrapper.appendChild(div2)

  const div3 = document.createElement('div')
  const img3 = document.createElement('img')
  img3.src = chrome.extension.getURL('images/howto_3.svg')
  div3.className = 'swiper-slide'
  div3.appendChild(img3)
  wrapper.appendChild(div3)

  const div4 = document.createElement('div')
  const img4 = document.createElement('img')
  img4.src = chrome.extension.getURL('images/howto_4.svg')
  div4.className = 'swiper-slide'
  div4.appendChild(img4)
  wrapper.appendChild(div4)

  const pagenation = document.createElement('div')
  pagenation.className = 'swiper-pagination'
  container.appendChild(pagenation)

  const prevBtn = document.createElement('div')
  prevBtn.className = 'swiper-button-prev'
  container.appendChild(prevBtn)

  const nextBtn = document.createElement('div')
  nextBtn.className = 'swiper-button-next'
  container.appendChild(nextBtn)

  return container
}

const wordFrameWidth = Math.max(window.innerWidth / 5, 320)
const wordFrameHeight = Math.max(wordFrameWidth * 3 / 5, 240)

const wordFrame = jsFrame.create({
  name: 'dictionary-window',
  title: 'YouTube字幕 英和辞典',
  left: 20,
  top: 50,
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

wordFrame.htmlElement.parentElement.parentElement.style.zIndex = 99999

wordFrame.on('closeButton', 'click', (_wordFrame, evt) => {
  const yVideo = document.getElementsByTagName('video')
  if(yVideo && WORD_CLOSE_START_VIDEO_FLAG){
    yVideo[0].play()
  }
  _wordFrame.hide()
});

function addWord(word, mean, sentence){
  chrome.runtime.sendMessage(
    { flag: 'addWordNote', data:{ word: word, mean: mean, sentence: sentence} }
  )
}

function getFloatingWindowHtml(wordMeanList, sentence, word){
  const retHtml = document.createElement('div')
  retHtml.style.cssText = 'padding:10px 5px; font-size:1.5rem;'

  if(wordMeanList.length === 0){
    const wordNotFound = document.createElement('span')
    wordNotFound.innerHTML = word + ' ' + chrome.i18n.getMessage('wordNotFound')
    retHtml.appendChild(wordNotFound)

    const wordAddBtn = document.createElement('button')
    wordAddBtn.style.cssText = 'color: #EF6C00; border: solid 1px #EF6C00; border-radius: 3px; font-size:1.0rem; margin-left:10px; background-color: transparent;'
    wordAddBtn.innerHTML = chrome.i18n.getMessage('addButtonRegister')
    wordAddBtn.onclick = function(e){
      e.currentTarget.style.color = '#B0BEC5'
      e.currentTarget.style.borderColor = '#B0BEC5'
      e.currentTarget.innerHTML = chrome.i18n.getMessage('addButtonComplete')
      e.currentTarget.disabled = true;
      addWord(word, [], sentence)
    }
    retHtml.appendChild(wordAddBtn)
    return retHtml
  }

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
    wordAddBtn.style.cssText = 'color: #EF6C00; border: solid 1px #EF6C00; border-radius: 3px; font-size:1.0rem; margin-left:10px; background-color: transparent;'
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


function setTitleObserver(){
  // console.log('observer')
  const title = document.querySelector('title')
  
  if(title == null){
    window.setTimeout(setTitleObserver, TIMEOUT_DULATION)
    return
  }

  setCaptionObserver()
  titleObserver.observe(title,{
    characterData: true, childList: true
  })
}

const titleObserver = new MutationObserver( () => {
  captionObserver.disconnect()
  // console.log('title change')
  removeCloneCaption()
  setCaptionObserver()
})


function setCaptionObserver(){
  const captionWindow = document.querySelector('div[id*="caption-window"]')
  if(captionWindow === null) {
    window.setTimeout(setCaptionObserver, TIMEOUT_DULATION)
    return
  }

  // if(captionWindow.getAttribute('draggable') !== 'true'){
  //   console.log('not drag')
  //   window.setTimeout(setCaptionObserver, TIMEOUT_DULATION)
  //   return
  // }

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
  if(yVideo && WORD_CLICK_STOP_VIDEO_FLAG){
    yVideo[0].pause()
  }
  const meanList = getMeaningList(word, sentence)
  wordFrame.getFrameView().innerHTML = ''
  wordFrame.getFrameView().appendChild(getFloatingWindowHtml(meanList, sentence, word))

  const windowSize = wordFrame.getSize()
  const windowPositoin = wordFrame.getPosition()
  // console.log(windowSize)
  // console.log(windowPositoin)
  if(window.innerWidth < (windowPositoin.x + windowSize.width)){
    const new_x = window.innerWidth - windowSize.width - 20
    wordFrame.setPosition(new_x, windowPositoin.y, 'LEFT_TOP')
  }else if(windowPositoin.x < 0){
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

  wordFrame.getFrameView.scrollTop = 0
  wordFrame.show()
}

const captionObserver = new MutationObserver( () => {
  removeCloneCaption()

  let captionWindow = document.querySelectorAll('div[id*="caption-window"]')
  if(captionWindow.length === 0){
    // console.log('none')
    return;
  }

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
    const separator = /([^a-zA-Z_0-9\.\’\']+|\.\.\.|\.\.|'')/
    const wordList = text.split(separator)
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
      
      const wordSpanElm = document.createElement('span')
      wordSpanElm.innerHTML = validWord
      // wordSpanElm.style.color = 'red'
      wordSpanElm.className = ENG_WORD_SPAN_CLASS
      wordSpanElm.setAttribute(WOED_SPAN_DATA_ATTRIBUTE, text);
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

  captionObserver.observe(captionWindow.parentElement.parentElement, {
    childList: true,
    subtree: true
  })

})

