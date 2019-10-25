import { Masker, Animation } from '../../components';
import $css from './preview.styl';

export default {
  name: 'PreviewImage',
  data() {
    return {
      visible: false,

      imgListLen: 0,
      activeIndex: -1,
      // 设备宽度
      clientWidth: 0,
      // 设备高度
      clientHeight: 0,

      // 是否有动画效果
      effect: false,
      // 单指触摸初始X轴位置
      startX: 0,
      // 单指触摸初始Y轴位置
      startY: 0,
      // 多指触摸对象
      touches: [],
      touchNow: false,

      // 整个相册偏移，负数
      diffX: 0,
      diffY: 0,

      // 当前图片缩放比例
      scale: 1,
      // 当前图片显示尺寸px 最大100%
      trueWidth: 0,
      trueHeight: 0,

      // 当前图片的拖动偏移
      imgDiffX: 0,
      imgDiffY: 0,

      // 当前图片初始偏移
      imgDiffInitX: 0,
      imgDiffInitY: 0
    };
  },
  mounted() {
    this.visible = true;
    this.imgListLen = this.images.length;

    this.$nextTick(() => {
      const elStyle = window.getComputedStyle(this.$el);
      this.clientWidth = parseFloat(elStyle.width);
      this.clientHeight = parseFloat(elStyle.height);
      this.activeIndex = this.index;
      this.diffX = -this.clientWidth * this.index;
    });
  },
  watch: {
    activeIndex(newVal) {
      if (newVal > -1) {
        this.loadImage();
      }
    }
  },
  render(h) {
    const { visible, images, imgListLen, diffX, effect, scale, imgDiffX, imgDiffY, activeIndex, trueWidth, trueHeight } = this;

    return (
      <Masker class={$css.masker} visible={visible}>
        <Animation class="h100p" type="fadeIn" visible={visible} onAnimationend={this.animationendAction}>
          <div class={$css.imgListBox} ref="imgListBox" onClick={this.hide}>
            <div class={$css.imgListWraper} style={{ width: `${imgListLen * 100}%`, transform: `translate3d(${diffX}px, 0, 0)`, transitionDuration: effect ? '.3s' : '0s' }}>
              {
                images.map((src, index) => (
                  <div class={[$css.imgItem, { z1: activeIndex === index }]} onTouchstart={this.touchStart}>
                    <img src={src} width={trueWidth} height={trueHeight} style={ activeIndex === index ? { transform: `scale(${scale}) translate(${imgDiffX}px, ${imgDiffY}px)`, transitionDuration: effect ? '.3s' : '0s' } : {}} />
                  </div>
                ))
              }
            </div>
          </div>
          <div class="ab top left w100p tc h30 lh30">
            <i class={$css.viewIndex}>{activeIndex + 1}/{imgListLen}</i>
          </div>
        </Animation>
      </Masker>
    );
  },
  methods: {
    hide() {
      this.visible = false;
    },
    animationendAction() {
      if (!this.visible) {
        this.$el.parentNode.removeChild(this.$el);
      }
    },
    loadImage() {
      const { images, activeIndex } = this;
      const { innerWidth, innerHeight } = window;
      const img = new Image();
      img.onload = () => {
        if (img.width <= innerWidth && img.height <= innerHeight) {
          // 宽高都在窗口内，不作缩放
          this.trueWidth = img.width;
          this.trueHeight = img.height;
        } else {
          // 优先设置为全宽
          // 如果全宽后高度还超出窗口，则以窗口高度为标准来缩小宽度
          const imgTmpWidth = innerWidth;
          const imgTmpHeight = img.height * (innerWidth / img.width);

          if (imgTmpHeight > innerHeight) {
            this.trueHeight = innerHeight;
            this.trueWidth = img.width * (innerHeight / img.height);
          } else {
            this.trueWidth = imgTmpWidth;
            this.trueHeight = imgTmpHeight;
          };
        }
      };
      img.src = images[activeIndex];
    },
    touchStart(e) {
      e.preventDefault();

      this.startX = e.touches[0].clientX - this.diffX;
      this.startY = e.touches[0].clientY - this.diffY;
      this.imgDiffInitX = this.imgDiffX;
      this.imgDiffInitY = this.imgDiffY;
      if (e.touches && e.touches.length > 0) {
        if (e.touches.length === 1) {
          // 单指拖动
          // 无缩放：左右切换图片
          // 已缩放：移动图片
          window.addEventListener('touchmove', this.moveImg);
          window.addEventListener('touchend', this.leaveImg);
          window.addEventListener('touchcancel', this.leaveImg);
        } else if (e.touches.length === 2) {
          // 多指缩放 暂存touchStart
          this.touches = e.touches;
          window.addEventListener('touchmove', this.touchScale);
          window.addEventListener('touchend', this.cancelTouchScale);
        }
      }
    },
    moveImg(e) {
      // 若图片已放大，则仅拖动当前图片，否则整个相册移动
      if (this.scale > 1) {
        // 偏移量，左正右负
        const changeX = e.touches[0].clientX - this.startX - this.diffX;
        const changeY = e.touches[0].clientY - this.startY - this.diffY;
        this.imgDiffX = this.imgDiffInitX + (changeX / this.scale);
        this.imgDiffY = this.imgDiffInitY + (changeY / this.scale);
      } else {
        // 相册偏移量，左正右负
        const changeX = e.touches[0].clientX - this.startX;
        // 右侧最大偏移距离，正数
        const maxOffset = this.clientWidth * (this.imgListLen - 1);
        // 右侧超出边距，正数
        const rightOffsetX = -maxOffset - changeX;

        if (changeX > 0) {
          // 往右-->，且超出视图 rate: 0 ~ 0.3
          const rate = 0.3 * (changeX / this.clientWidth);
          this.diffX = changeX * rate;
        } else if (rightOffsetX > 0) {
          // 往左 <--，且超出视图 rate: 0 ~ 0.3
          const rate = 0.3 * (rightOffsetX / this.clientWidth);
          this.diffX = -(rightOffsetX * rate + maxOffset);
        } else {
          this.diffX = changeX;
        }
      }
      this.effect = false;
    },
    leaveImg() {
      // 若完成单图片拖动
      if (this.scale > 1) {
        const { imgListLen, imgDiffX, imgDiffY, trueWidth, trueHeight } = this;
        const leftMax = (trueWidth * (this.scale - 1) * 0.5) / this.scale;
        const rightMin = -leftMax;

        // 左右两边的边界判断
        if (imgDiffX > leftMax) {
          // 左侧超出边界，可以上一屏，放手上一屏
          if (this.activeIndex > 0) {
            this.activeIndex = this.activeIndex - 1;
            this.scale = 1;
            this.imgDiffX = 0;
            this.imgDiffY = 0;
            this.diffX = -this.clientWidth * this.activeIndex;
          } else {
            // 左侧超出边界，已是第一张，放手回正
            this.imgDiffX = leftMax;
          }
        } else if (imgDiffX < rightMin) {
          if (this.activeIndex < (imgListLen - 1)) {
            // 左侧超出边界，可以下一屏，放手下一屏
            this.activeIndex = this.activeIndex + 1;
            this.scale = 1;
            this.imgDiffX = 0;
            this.imgDiffY = 0;
            this.diffX = -this.clientWidth * this.activeIndex;
          } else {
            // 右侧超出边界，放手回正
            this.imgDiffX = rightMin;
          }
        }

        // 上下边界判断
        const topOffset = ((trueHeight * this.scale) - window.innerHeight) * 0.5;
        // 放大已超出屏幕高度
        if (topOffset > 0) {
          const topMax = topOffset / this.scale;
          const bottomMin = -topMax;
          if (imgDiffY > topMax) {
            this.imgDiffY = topMax;
          } else if (imgDiffY < bottomMin) {
            this.imgDiffY = bottomMin;
          }
        }

        // 放手后有动效
        this.effect = true;
      } else {
        // 完成相册拖动
        const maxOffset = -this.clientWidth * (this.imgListLen - 1);
        if (this.diffX > 0) {
          // 左侧回正
          this.diffX = 0;
        } else if (this.diffX < maxOffset) {
          // 右侧回正
          this.diffX = maxOffset;
        } else {
          // 中间超0.2算下一屏
          const indexRound = Math.abs(Math.floor(this.diffX / this.clientWidth));
          const indexLess = Math.abs(this.diffX % this.clientWidth) / this.clientWidth;

          if (indexLess < 0.01) {
            // 无滑动，点击关闭
            this.hide();
          } else if (indexRound > this.activeIndex && indexLess > 0.2) {
            // 下一张
            this.activeIndex = this.activeIndex + 1;
            this.scale = 1;
            this.imgDiffX = 0;
            this.imgDiffY = 0;
          } else if (indexRound <= this.activeIndex && indexLess < 0.8 && indexLess > 0.2) {
            // 上一张
            this.activeIndex = this.activeIndex - 1;
            this.scale = 1;
            this.imgDiffX = 0;
            this.imgDiffY = 0;
          }
          this.diffX = -this.clientWidth * this.activeIndex;
        }
        this.effect = true;
      }

      window.removeEventListener('touchmove', this.leaveImg);
      window.removeEventListener('touchend', this.leaveImg);
      window.removeEventListener('touchcancel', this.leaveImg);
    },
    touchScale(e) {
      e.preventDefault();
      let scale = this.scale;
      // 记录变化量
      // 第一根手指
      const oldTouch1 = {
        x: this.touches[0].clientX,
        y: this.touches[0].clientY
      };
      const newTouch1 = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY
      };
      // 第二根手指
      const oldTouch2 = {
        x: this.touches[1].clientX,
        y: this.touches[1].clientY
      };
      const newTouch2 = {
        x: e.touches[1].clientX,
        y: e.touches[1].clientY
      };
      const oldL = Math.sqrt(Math.pow(oldTouch1.x - oldTouch2.x, 2) + Math.pow(oldTouch1.y - oldTouch2.y, 2));
      const newL = Math.sqrt(Math.pow(newTouch1.x - newTouch2.x, 2) + Math.pow(newTouch1.y - newTouch2.y, 2));
      const cha = newL - oldL;

      // 根据图片本身大小 决定每次改变大小的系数, 图片越大系数越小
      // 1px - 0.2
      let coe = 3;
      coe = (coe / this.trueWidth) > (coe / this.trueHeight) ? (coe / this.trueHeight) : (coe / this.trueWidth);
      coe = coe > 0.1 ? 0.1 : coe;
      const num = coe * cha;
      if (!this.touchNow) {
        this.touchNow = true;
        if (cha > 0) {
          scale += Math.abs(num);
        } else if (cha < 0) {
          scale > Math.abs(num) ? (scale -= Math.abs(num)) : scale;
        }
        this.touches = e.touches;
        setTimeout(() => {
          this.touchNow = false;
        }, 8);

        this.effect = false;
        // 最小缩小至0.5
        this.scale = scale < 0.5 ? 0.5 : scale;
      }
    },
    cancelTouchScale(e) {
      this.effect = true;
      this.touches = [];

      // 缩放范围 0.5 ~ 2
      if (this.scale < 1) {
        this.scale = 1;
      } else if (this.scale > 2) {
        this.scale = 2;
      }

      window.removeEventListener('touchmove', this.touchScale);
      window.removeEventListener('touchend', this.touchScale);
    }
  }
};
