// pages/funtionPage/funtionPage.js
var app = getApp();
var utils = require("../../utils/util.js");
Page({

  /**
   * 页面的初始数据
   */
  data: {
    textLog:"",
    deviceId: "",
    name: "",
    allRes:"",
    serviceId:"",
    readCharacteristicId:"",
    writeCharacteristicId: "",
    notifyCharacteristicId: "",
    connected: true,
    canWrite: false,
    buttons: [
      { name: "测血压", cmd: "C711" },
      { name: "设置时间", cmd: "A307E307090F2D13" },
      { name: "计步同步", cmd: "B2FA" },
      { name: "睡眠同步", cmd: "B3FA" },
      { name: "心率同步", cmd: "E6FA" },
      { name: "开始测试", cmd: "E511" },
      { name: "停止测试", cmd: "E500" },
      { name: "同步血压", cmd: "C8FA" },
      { name: "测血压", cmd: "C711" },
      { name: "停测血压", cmd: "C700" },
      { name: "固件升级", cmd: "C8FA" },
      { name: "打开闹钟", cmd: "AB7F10190205020001" },
      { name: "关闭闹钟", cmd: "AB7F10170000000001" },
      { name: "获取蓝牙版本", cmd: "A1" },
      { name: "获取设备电量", cmd: "A2" },
      { name: "切换公制", cmd: "A00101" },
      { name: "切换英制", cmd: "A00201" },
      { name: "推送消息内容", cmd: "C500020C63A890016D88606F51855BB9" },
      { name: "震动", cmd: "AB00000001010000"},
      { name: "测试通道", cmd: "0208" },
      { name: "打开相机", cmd: "C401" },
      { name: "关闭相机", cmd: "C403" },
      { name: "同步跳绳", cmd: "B9FA" },
      { name: "今天运动时间", cmd: "CC" },
      { name: "7天运动时间", cmd: "CDFA" },
    ],
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    var that = this;
    var devid = decodeURIComponent(options.deviceId);
    var devname = decodeURIComponent(options.name);
    var devserviceid = decodeURIComponent(options.serviceId);
    var log = that.data.textLog + "设备名=" + devname +"\n设备UUID="+devid+"\n服务UUID="+devserviceid+ "\n";
    this.setData({
      textLog: log,
      deviceId: devid,
      name: devname,
      serviceId: devserviceid 
    });
    //获取特征值
    that.getBLEDeviceCharacteristics();
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    if (wx.setKeepScreenOn) {
      wx.setKeepScreenOn({
        keepScreenOn: true,
        success: function (res) {
          //console.log('保持屏幕常亮')
        }
      })
    }
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {
    
  },

  //清空log日志
  startClear: function () {
    var that = this;
    that.setData({
      textLog: ""
    });
  },
  //返回蓝牙是否正处于链接状态
  onBLEConnectionStateChange:function (onFailCallback) {
    wx.onBLEConnectionStateChange(function (res) {
      // 该方法回调中可以用于处理连接意外断开等异常情况
      console.log(`device ${res.deviceId} state has changed, connected: ${res.connected}`);
      return res.connected;
    });
  },
  //断开与低功耗蓝牙设备的连接
  closeBLEConnection: function () {
    var that = this;
    wx.closeBLEConnection({
      deviceId: that.data.deviceId
    })
    that.setData({
      connected: false,

    });
    wx.showToast({
      title: '连接已断开',
      icon: 'success'
    });
    setTimeout(function () {
      wx.navigateBack();
    }, 2000)
  },
  //获取蓝牙设备某个服务中的所有 characteristic（特征值）
  getBLEDeviceCharacteristics: function (order){
    var that = this;
    wx.getBLEDeviceCharacteristics({
      deviceId: that.data.deviceId,
      serviceId: that.data.serviceId,
      success: function (res) {
        for (let i = 0; i < res.characteristics.length; i++) {
          let item = res.characteristics[i]
          console.log(item.uuid)
          if (item.properties.read) {//该特征值是否支持 read 操作
            var log = that.data.textLog + "该特征值支持 read 操作:" + item.uuid + "\n";
            that.setData({
              textLog: log,
              readCharacteristicId: item.uuid
            });
          }
          if (item.properties.write) {//该特征值是否支持 write 操作
            var log = that.data.textLog + "该特征值支持 write 操作:" + item.uuid + "\n";
            that.setData({
              textLog: log,
              writeCharacteristicId: item.uuid,
              canWrite:true
            });
            
          }
          if (item.properties.notify || item.properties.indicate) {//该特征值是否支持 notify或indicate 操作
            var log = that.data.textLog + "该特征值支持 notify 操作:" + item.uuid + "\n";
            that.setData({
              textLog: log,
              notifyCharacteristicId: item.uuid,
            });
            that.notifyBLECharacteristicValueChange();
          }

        }

      }
    })
    // that.onBLECharacteristicValueChange();   //监听特征值变化
  },
  //启用低功耗蓝牙设备特征值变化时的 notify 功能，订阅特征值。
  //注意：必须设备的特征值支持notify或者indicate才可以成功调用，具体参照 characteristic 的 properties 属性
  notifyBLECharacteristicValueChange: function (){
    var that = this;
    wx.notifyBLECharacteristicValueChange({
      state: true, // 启用 notify 功能
      deviceId: that.data.deviceId,
      serviceId: that.data.serviceId,
      characteristicId: that.data.notifyCharacteristicId,
      success: function (res) {
        var log = that.data.textLog + "notify启动成功" + res.errMsg+"\n";
        that.setData({ 
          textLog: log,
        });
        that.onBLECharacteristicValueChange();   //监听特征值变化
      },
      fail: function (res) {
        wx.showToast({
          title: 'notify启动失败',
          mask: true
        });
        setTimeout(function () {
          wx.hideToast();
        }, 2000)
      }

    })

  },
  //监听低功耗蓝牙设备的特征值变化。必须先启用notify接口才能接收到设备推送的notification。
  onBLECharacteristicValueChange:function(){
    var that = this;
    wx.onBLECharacteristicValueChange(function (res) {
      var resValue = utils.ab2hext(res.value); //16进制字符串
      var resValueStr = utils.hexToString(resValue);
  
      var log0 = that.data.textLog + "字符结果：" + resValueStr + "<--\n" + "16hex结果: " + resValue + "<--\n";
      that.setData({
        textLog: log0,
      });

    });
  },
  //orderInput
  orderInput:function(e){
    this.setData({
      orderInputStr: e.detail.value
    })
  },

  //发送指令
  sentOrder:function(){
    var that = this; 
    var orderStr = that.data.orderInputStr;//指令
    let order = utils.hexStringToArrayBuffer(orderStr); //this.Str2Bytes('0xAB00000001010000');// 0xAB00000001010000;//
    var log = that.data.textLog + "-->发送: " + orderStr + "\n";
    that.setData({
      textLog: log,
    });


    that.writeBLECharacteristicValue(order);
  },
  AB00000001010000: function () {
    this.setData({
      orderInputStr: 'AB00000001010000'
    })
    this.sentOrder();
  },
  A1: function(){
    this.setData({
      orderInputStr: 'A1'
    })
    this.sentOrder();
  },
  A307E307090F2D13: function() {
    this.setData({
      orderInputStr: 'A307E307090F2D13'
    })
    this.sentOrder();
  },
  B2FA: function() {
    this.setData({
      orderInputStr: 'B2FA'
    })
    this.sentOrder();
  },
  //发送16hex 命令
  sendCmd: function (e) {
    const ds = e.currentTarget.dataset;
    const cmd = ds.cmd; //cmd
    this.setData({
      orderInputStr: cmd
    })
    this.sentOrder();
  },



  //向低功耗蓝牙设备特征值中写入二进制数据。
  //注意：必须设备的特征值支持write才可以成功调用，具体参照 characteristic 的 properties 属性
  writeBLECharacteristicValue: function (order){
    var that = this;
    let byteLength = order.byteLength;
    // var log = that.data.textLog + "当前执行指令的字节长度:" + byteLength + "\n";
    // that.setData({
    //   textLog: log,
    // });

    //app.showModal1(that.data.writeCharacteristicId);

    wx.writeBLECharacteristicValue({
      deviceId: that.data.deviceId,
      serviceId: that.data.serviceId,
      characteristicId: that.data.writeCharacteristicId,
      // 这里的value是ArrayBuffer类型
      // value: order.slice(0, 20),
      value: order,
      success: function (res) {
        // if (byteLength > 20) {
        //   setTimeout(function(){
        //     that.writeBLECharacteristicValue(order.slice(20, byteLength));
        //   },150);
        // }
        var log = that.data.textLog + "成功写入" + byteLength + "字节\n";
        that.setData({
          textLog: log,
        });
      },

      fail: function (res) {
        var log = that.data.textLog + "写入失败: " + res.errMsg +"字节\n";
        that.setData({
          textLog: log,
        });
      }
      
    })
  }

})