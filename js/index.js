let mvvm = new Mvvm({
    el: '#app',
    data: {     // Object.defineProperty(obj, 'song', '发如雪');
        song: '发如雪',
        album: {
            name: '十一月的萧邦',
            theme: '夜曲'
        },
        singer: '周杰伦'
    }
});

console.log(mvvm)

