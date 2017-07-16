//此为可选择日期说传递的json数据，start_date为可选择日期所代表的时间戳（可能需要更改）,仅为模拟数据,正式数据应由getCourseCfgUrl所指定的url提供
var test_data = {
    "code": 200,
    "msg": "",
    "data": [
        {
            "start_date": "1500220800",//可选日期时间戳
            "time_list": [
                {//可选日期当日时间段
                    "id": "6995",
                    "start_time": "01:00",
                    "end_time": "02:00",
                    "num": "10",//商品总数
                    "remain_num": "10"//剩余可选数量
                }
            ],
            "is_full": "0"
        }
    ]
};

// 以下正文//
var app = getApp();
var getCourseCfgUrl = 'http://www.baidu.com';//请求可选择日期的url地址
var course_cfg_id = '443';
var allowed_info = '';//需显示在日历中的数据
var time_id = 0;
var window_height = 0;

const date = new Date();
const cur_year = date.getFullYear();
const cur_month = date.getMonth() + 1;
const next_month = date.getMonth() + 2 > 12 ? 1 : date.getMonth() + 2;
const weeks_ch = ['日', '一', '二', '三', '四', '五', '六'];
Page({
  data:{
    hasEmptyGrid: false,
    select_info:'',
    select_num:'',
    day:'',
    remain_num:'0',
    value:'',
    mask_is_hide: true,
    month:'',
    day:'',
  },
  onLoad(options) {
    this.geDeviceInfo();
    this.getCourseCfg(course_cfg_id);
    this.calculateEmptyGrids(cur_year, cur_month);
    this.setData({
      cur_year,
      cur_month,
      weeks_ch,
      window_height
    });
  },
  getThisMonthDays(year, month) {//获得本月天数
    return new Date(year, month, 0).getDate();
  },
  getFirstDayOfWeek(year, month) {
    return new Date(Date.UTC(year, month - 1, 1)).getDay();
  },
  calculateEmptyGrids(year, month) {
    const firstDayOfWeek = this.getFirstDayOfWeek(year, month);
    let empytGrids = [];
    if (firstDayOfWeek > 0) {
      for (let i = 0; i < firstDayOfWeek; i++) {
        empytGrids.push(i);
      }
      this.setData({
        hasEmptyGrid: true,
        empytGrids
      });
    } else {
      this.setData({
        hasEmptyGrid: false,
        empytGrids: []
      });
    }
  },
  calculateDays(year, month, allowed_info) {//用于显示于界面的日期数据
    let days = [];
    const thisMonthDays = this.getThisMonthDays(year, month+1);
    for (let i = 1; i <= thisMonthDays; i++) {
      let timestr = year + "/" + month + "/" + i;
      let day_time = Date.parse(timestr).toString().substr(0, 10);//构造第一个月说含时间戳
      let disabled = 1;//默认所有天数均为不可选择的状态
      let num = [];//可选择数量，为方便遍历因此为一维数组
      let time_list = [];//实际可选择商品数据
      allowed_info.forEach(function (item, index){
        if (item['start_date'] == day_time){//两时间相等，则该天可选课
          disabled = 0;
          time_list = item['time_list'];
        }
      });
      days[i-1] = {
        'day': i ,
        'month':month,
        'time': day_time,
        'disabled': disabled,
        'num': num,
        'time_list': time_list
      }
    }
    return days
  },
  getCourseCfg() {//获取数据源
    var that = this;
    that.commAjax(getCourseCfgUrl, {}, function(res){
    allowed_info = test_data ? test_data.data : res.data;
    var current = that.calculateDays(cur_year, cur_month, allowed_info);
    that.setData({
      days:current,
    })
    });
  },
  bindPickerChange: function (e) {//滚动选择上课时间和数量
    let val = e.detail.value;//选中的时间及数量，从左至右分别为数组的第一项第二项
    let temp_info = '';
    temp_info = this.data.select_info[val[0]];
    if(this.data.select_info){//调用cancel方法会误触发该bindPickerChange，而cancel方法会清空select_info，为避免time_id获取不到数据，故添加该判断
      let remain_nums = '';
      let remain_num = [];
      time_id = temp_info['id'];
      remain_nums = temp_info['remain_num'];
      for (let i = 1; i <= remain_nums;i++){
        remain_num.push(i);
      }
      this.setData({
        num: remain_num[val[1]],//选中数量
        remain_num: remain_num
      })
    }
  },
  bindNewPicker:function(e){//点击可选日期
    console.log('bindNewPicker');
    let val = e.detail.value;
    let info = e.detail.data-info;
    let num = e.detail.data-num;
    let day = e.currentTarget.dataset.day;
    let month = e.currentTarget.dataset.month;
    let select_info = '';
    let remain_nums = '';
    let remain_num =[];
    if(month == this.data.days[day-1]['month']){
      select_info = this.data.days[day-1]['time_list'];//当前选择日期
    }else{
      select_info = this.data.next_days[day-1]['time_list'];
    }
    remain_nums = select_info[0]['remain_num'];
    time_id = select_info[0]['id'];//默认选择第一项的time_id作为购买某时间段内课程的凭证
    for (let i = 1; i <= remain_nums; i++) {
      remain_num.push(i);
    }
    this.setData({
      select_info: select_info,
      remain_num: remain_num,
      num: remain_num[0], //默认选择数量
      mask_is_hide: false,
      day: day,
      month: month
    });
  },
  bindNextStep:function(){//下一步,跳转页面
    var num =  this.data.num;
    wx.navigateTo({//time_id代表选中日期时间段的id，num代表选择的数量
      url:'/pages/url/url?time_id='+time_id+'&num='+num,
    })
  },
  cancel: function(){//取消蒙层
    this.setData({
      mask_is_hide: true,
      select_info:'',
      remain_num:''
    });
  },
  geDeviceInfo: function(){//获取设备信息，仅为实现弹窗的合适高度
    wx.getSystemInfo({
      success: function(res) {
        window_height = res.windowHeight;
      }
    })
  },
  commAjax: function (requestUrl, data, func, complete_func) {//封装请求
    var v_response;
    wx.request({
      url: requestUrl,
      data: {
        'data': data
      },
      method: 'POST',
      success: function (data) {
        (func !== null && func != undefined) ? func(data.data) : (function (req) {
          v_response = req;
        })();
      },
      fail: function () {
        // fail
        console.log('rest_fail');
      },
      complete: function () {
        if(complete_func !== null && complete_func != undefined) {
            complete_func();
        }
        console.log('rest_complete');
      }
    })
    return v_response;
  }
});
