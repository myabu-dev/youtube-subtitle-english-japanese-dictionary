const clickStopCheckbox = document.getElementById('click-stop-checkbox')
const closeStartCheckbox = document.getElementById('close-start-checkbox')

chrome.storage.local.get(["word_click_stop", "word_close_start"], function (result) {
  console.log(result.word_click_stop)
  if(result.word_click_stop !== null){
    clickStopCheckbox.checked = result.word_click_stop
  }else{
    clickStopCheckbox.checked = true
  }

  if(result.word_close_start !== null){
    closeStartCheckbox.checked = result.word_close_start;
  }else{
    closeStartCheckbox.checked = true
  }
  document.getElementById('click-stop-switch').className = "toggle-switch"
  document.getElementById('close-start-switch').className = "toggle-switch"

  clickStopCheckbox.addEventListener('change', cliskStopSwitchChange)
  closeStartCheckbox.addEventListener('change', closeStartSwitchChange)

})


function cliskStopSwitchChange(){
  const clickStopFlag = clickStopCheckbox.checked
  chrome.storage.local.set({'word_click_stop': clickStopFlag}, function () {
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs){
      chrome.tabs.sendMessage(tabs[0].id, {
        flag: "loadSetting"
      })
    })
  })
}

function closeStartSwitchChange(){
  const closeStartFlag = clickStopCheckbox.checked
  chrome.storage.local.set({'word_close_start': closeStartFlag}, function () {
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs){
      chrome.tabs.sendMessage(tabs[0].id, {
        flag: "loadSetting"
      })
    })
  })
}
