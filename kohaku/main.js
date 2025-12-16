let team0 = [];
let team1 = [];

let teams = []

let tbl = document.getElementById("tbl");
let num = 1;
let timelst = { 2: "早め", 1: "普通", 0: "遅め" };
let flag = 0

$(function () {
  //行追加
  $(document).on('click', '#add', function () {
    if ($('input[id="team-switch"]').prop('checked')) {
      $('#tbl').append('<tr><th><input type="text" id="name" class="name' + num + '" autocomplete="off"></th><th> <input type="number" id="gati" class="gati' + num + '" min="1" max="5" value="5"></th><th><select name="team" id="time" class="time' + num + '"><option value="2">早め</option><option value="1">普通</option><option value="0">遅め</option></select></th><th class="team-col" style="display: none;"><select name="team" id="team" class="team' + num + '"><option value="0">チームA</option><option value="1">チームB</option></select></th><th><button class="del">削除</button></th>')
    } else {
      $('#tbl').append('<tr><th><input type="text" id="name" class="name' + num + '" autocomplete="off"></th><th> <input type="number" id="gati" class="gati' + num + '" min="1" max="5" value="5"></th><th><select name="team" id="time" class="time' + num + '"><option value="2">早め</option><option value="1">普通</option><option value="0">遅め</option></select></th><th class="team-col"><select name="team" id="team" class="team' + num + '"><option value="0">チームA</option><option value="1">チームB</option></select></th><th><button class="del">削除</button></th>')
    }
    num++;
  });

  // 行削除
  $(document).on('click', '.del', function () {
    $(this).closest("tr").remove();
    num--;
  })

  $('input[id="team-switch"]').change(function () {
    if ($(this).prop('checked')) {
      $('.team-col').css('display', 'none');
    }
    else {
      $('.team-col').css('display', '');
    }
  })

  //行上下
  $(document).on('click', '.row-up', function () {
    let $row = $(this).closest("tr");
    let $row_prev = $row.prev("tr");
    if ($row.prev.length) {
      $row.insertBefore($row_prev);
    }
  });

  $(document).on('click', '.row-down', function () {
    let $row = $(this).closest("tr");
    let $row_next = $row.next("tr");
    if ($row_next.length) {
      $row.insertAfter($row_next);
    }
  })

  // $(".row-up").click(function () {
  //   let $row = $(this).closest("tr");
  //   let $row_prev = $row.prev("tr");
  //   if ($row.prev.length) {
  //     $row.insertBefore($row_prev);
  //   }
  // });

  // $(".row-down").click(function () {
  //   let $row = $(this).closest("tr");
  //   let $row_next = $row.next("tr");
  //   if ($row_next.length) {
  //     $row.insertAfter($row_next);
  //   }
  // });


  //実行
  $(document).on('click', '#submit', function () {
    // チーム分け
    if ($('input[id="team-switch"]').prop('checked')) {
      for (let i = 0; i < num; i++) {
        if (flag == 0) {
          team0.push({ name: $('.name' + i).val(), gati: $('.gati' + i).val(), time: $('.time' + i).val() });
          flag = 1;
        } else {
          team1.push({ name: $('.name' + i).val(), gati: $('.gati' + i).val(), time: $('.time' + i).val() });
          flag = 0;
        }
      }
    } else {
      for (let i = 0; i < num; i++) {
        if ($('.team' + i).val() == 0) {
          team0.push({ name: $('.name' + i).val(), gati: $('.gati' + i).val(), time: $('.time' + i).val() })
        } else {
          team1.push({ name: $('.name' + i).val(), gati: $('.gati' + i).val(), time: $('.time' + i).val() })
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

      // const tableLeft =  $("<div class=\"table-left\"><table><tbody>");
      // $("<tr><th>名前</th><th>ガチ度</th><th>時間</th></tr>").appendTo(tableLeft);

      // for (let i = 0; i < team0.length; i++) {
      //   $("<tr><th>" + team0[i].name + "</th><th>" +  team0[i].gati + "</th><th>" + timelst[team0[i].time] + "</th></tr>").appendTo(tableLeft);
      // }
      // $("</tbody></table></div>").appendTo(tableLeft);
      // $("#output").append(tableLeft);

      // const vs = $("<div class=\"vs\"><p>VS</p></div>");
      // $("#output").append(vs);

      // const tableRight = $("<div class=\"table-right\"><table><tbody>");
      // $("<tr><th>時間</th><th>ガチ度</th><th>名前</th></tr>").appendTo(tableRight);

      // for (let i = 0; i < team1.length; i++) {
      //   $("<tr><th>" + timelst[team1[i].time] + "</th><th>" + team1[i].gati + "</th><th>" + team1[i].name + "</th></tr>").appendTo(tableRight);
      // }
      // $("</tbody></table></div>").appendTo(tableRight);
      // $("#output").append(tableRight);

      const output = document.getElementById("output");

      const tableLeftWrapper = document.createElement("div");
      tableLeftWrapper.className = "table-left";
      output.appendChild(tableLeftWrapper);

      const tableLeft = document.createElement("table");
      tableLeftWrapper.appendChild(tableLeft);

      const theadLeft = document.createElement("thead");
      tableLeft.appendChild(theadLeft);

      const trLeft = document.createElement("tr");
      theadLeft.appendChild(trLeft);

      const moveRowLeft = document.createElement("th");
      trLeft.appendChild(moveRowLeft);

      const nameLeft = document.createElement("th");
      nameLeft.textContent = "名前";
      trLeft.appendChild(nameLeft);

      const gatiLeft = document.createElement("th");
      gatiLeft.textContent = "ガチ度";
      trLeft.appendChild(gatiLeft);

      const timeLeft = document.createElement("th");
      timeLeft.textContent = "時間";
      trLeft.appendChild(timeLeft);

      for (let i = 0; i < team0.length; i++) {
        let tr = document.createElement("tr");
        tableLeft.appendChild(tr);

        let moveRow = document.createElement("th");
        tr.appendChild(moveRow);

        let upButton = document.createElement("button");
        upButton.textContent = "↑";
        upButton.className = "row-up";
        moveRow.appendChild(upButton);

        let br = document.createElement("br");
        moveRow.appendChild(br);

        let downButton = document.createElement("button");
        downButton.textContent = "↓";
        downButton.className = "row-down";
        moveRow.appendChild(downButton);

        let name = document.createElement("th");
        name.textContent = team0[i].name;
        tr.appendChild(name);

        let gati = document.createElement("th");
        gati.textContent = team0[i].gati;
        tr.appendChild(gati)

        let time = document.createElement("th");
        time.textContent = timelst[team0[i].time];
        tr.appendChild(time);
      }

      const vs = document.createElement("div");
      vs.className = "vs";
      vs.textContent = "VS";
      output.appendChild(vs);

      const tableRightWrapper = document.createElement("div");
      tableRightWrapper.className = "table-left";
      output.appendChild(tableRightWrapper);

      const tableRight = document.createElement("table");
      tableRightWrapper.appendChild(tableRight);

      const theadRight = document.createElement("thead");
      tableRight.appendChild(theadRight);

      const trRight = document.createElement("tr");
      theadRight.appendChild(trRight);

      const timeRight = document.createElement("th");
      timeRight.textContent = "時間";
      trRight.appendChild(timeRight);

      const gatiRight = document.createElement("th");
      gatiRight.textContent = "ガチ度";
      trRight.appendChild(gatiRight);

      const nameRight = document.createElement("th");
      nameRight.textContent = "名前";
      trRight.appendChild(nameRight);

      const moveRowRight = document.createElement("th");
      trRight.appendChild(moveRowRight);

      for (let i = 0; i < team1.length; i++) {
        let tr = document.createElement("tr");
        tableRight.appendChild(tr);

        let time = document.createElement("th");
        time.textContent = timelst[team1[i].time];
        tr.appendChild(time);

        let gati = document.createElement("th");
        gati.textContent = team1[i].gati;
        tr.appendChild(gati);

        let name = document.createElement("th");
        name.textContent = team1[i].name;
        tr.appendChild(name);

        let moveRow = document.createElement("th");
        tr.appendChild(moveRow);

        let upButton = document.createElement("button");
        upButton.textContent = "↑";
        upButton.className = "row-up";
        moveRow.appendChild(upButton);

        let br = document.createElement("br");
        moveRow.appendChild(br);

        let downButton = document.createElement("button");
        downButton.textContent = "↓";
        downButton.className = "row-down";
        moveRow.appendChild(downButton);
      }
    }

    team0 = [];
    team1 = [];
  })
})