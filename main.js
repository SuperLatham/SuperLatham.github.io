let team0 = [];
let team1 = [];

let tbl = document.getElementById("tbl");
let num = 1;
let timelst = {2: "早め", 1: "普通", 0: "遅め"};
let flag = 0

$(function() {
  //行追加
  $(document).on('click', '#add',function() {
    if($('input[id="team-switch"]').prop('checked')) {
      $('#tbl').append('<tr><th><input type="text" id="name" class="name' + num + '"></th><th> <input type="number" id="gati" class="gati' + num + '" min="1" max="5" value="5"></th><th><select name="team" id="time" class="time' + num + '"><option value="2">早め</option><option value="1">普通</option><option value="0">遅め</option></select></th><th class="team-col" style="display: none;"><select name="team" id="team" class="team' + num + '"><option value="0">チームA</option><option value="1">チームB</option></select></th><th><button class="del">削除</button></th>')
    } else {
      $('#tbl').append('<tr><th><input type="text" id="name" class="name' + num + '"></th><th> <input type="number" id="gati" class="gati' + num + '" min="1" max="5" value="5"></th><th><select name="team" id="time" class="time' + num + '"><option value="2">早め</option><option value="1">普通</option><option value="0">遅め</option></select></th><th class="team-col"><select name="team" id="team" class="team' + num + '"><option value="0">チームA</option><option value="1">チームB</option></select></th><th><button class="del">削除</button></th>')
    }
    num++;
  });

  // 行削除
  $(document).on('click', '.del',function() {
    $(this).closest("tr").remove();
    num--;
  })

  $('input[id="team-switch"]').change(function(){
    if($(this).prop('checked')){
      $('.team-col').css('display', 'none');
    }
    else{
      $('.team-col').css('display', '');
    }
  })

  //実行
  $(document).on('click', '#submit', function() {
    // チーム分け
    if($('input[id="team-switch"]').prop('checked')) {
      for(let i = 0; i < num; i++) {
        if (flag == 0) {
          team0.push({name:$('.name' + i).val(), gati:$('.gati' + i).val(), time:$('.time' + i).val()});
          flag = 1;
        } else {
          team1.push({name:$('.name' + i).val(), gati:$('.gati' + i).val(), time:$('.time' + i).val()});
          flag = 0;
        }
      }
    } else {
      for(let i = 0; i < num; i++) {
        if ($('.team' + i).val() == 0) {
          team0.push({name:$('.name' + i).val(), gati:$('.gati' + i).val(), time:$('.time' + i).val()})
        } else {
          team1.push({name:$('.name' + i).val(), gati:$('.gati' + i).val(), time:$('.time' + i).val()})
        }
      }
    }

    // 出力
    $("#output").empty();

    if (Object.keys(team0).length != Object.keys(team1).length) {
      $("#output").html("<p>チーム同士の人数が等しくありません</p>")
    } else {
      // ソート
      team0.sort((a, b) => {
        if (a.time === b.time) {
          return b.gati - a.gati;
        }
        return b.time - a.time;
      })

      team1.sort((a, b) => {
        if (a.time === b.time) {
          return b.gati - a.gati;
        }
        return b.time - a.time;
      })

      const table =  $("<table><tbody>");
      $("<tr><th>名前</th><th>ガチ度</th><th>時間</th><th></th><th>時間</th><th>ガチ度</th><th>名前</th></tr>").appendTo(table);

      for (let i = 0; i < team0.length; i++) {
        $("<tr><th>" + team0[i].name + "</th><th>" +  team0[i].gati + "</th><th>" + timelst[team0[i].time] + "</th><th>VS</th><th>" +  timelst[team1[i].time] + "</th><th>" + team1[i].gati + "</th><th>" + team1[i].name + "</th></tr>").appendTo(table);
      }
      $("</tbody></table>").appendTo(table);
      $("#output").append(table);
    }

    team0 = [];
    team1 = [];
  })
})