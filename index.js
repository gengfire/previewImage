import Vue from 'vue';
import Preview from './preview.vue';

export const previewImage = ({ images = [], index = 0 }) => {
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

export default const install = (Vue) => {
  Vue.prototype.$previewImage = previewImage;
};
