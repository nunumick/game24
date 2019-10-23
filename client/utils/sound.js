const tapSound = wx.createInnerAudioContext();
const gameStart = wx.createInnerAudioContext();
const gameSuccess = wx.createInnerAudioContext();
const gameError = wx.createInnerAudioContext();

tapSound.src = 'cloud://tf-cff797.7466-tf-cff797/tap2.mp3';
gameStart.src = 'cloud://tf-cff797.7466-tf-cff797/pop2.mp3';
gameSuccess.src ='cloud://tf-cff797.7466-tf-cff797/success.mp3';
gameError.src ='cloud://tf-cff797.7466-tf-cff797/wrong.mp3';

module.exports = {
  tapSound,
  gameStart,
  gameSuccess,
  gameError,
}