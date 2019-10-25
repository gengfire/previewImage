import Vue from 'vue';
// import { isWechat, wx } from '../../utils';
import Preview from './preview';

export const previewImage = ({ images = [], index = 0 }) => {
  // if (isWechat) {
  //   wx.ready(() => {
  //     wx.previewImage({
  //       current: images[index],
  //       urls: images
  //     });
  //   });
  //   return false;
  // }

  const PreviewImageComponent = Vue.extend(Preview);

  const component = new PreviewImageComponent({
    data: {
      images,
      index
    }
  }).$mount();

  const element = document.getElementById('container') || document.body;

  element.appendChild(component.$el);
};
