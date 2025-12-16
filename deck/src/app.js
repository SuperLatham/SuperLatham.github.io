document.addEventListener('DOMContentLoaded', () => {
    const fileInput = document.getElementById('file-input');
    const resultDiv = document.getElementById('result');
    const outputTextArea = document.createElement('textarea'); // テキストエリアを追加
    const hashChars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-_";
    let cardList = [];
    let templateText = '';

    // template.txtを読み込む
    fetch('../public/data/template.txt')
        .then(res => res.text())
        .then(data => {
            templateText = data;
        })
        .catch(() => {
            resultDiv.textContent = 'テンプレートの読み込みに失敗しました。';
        });

    // card_list.jsonを読み込む
    fetch('../public/data/card_list.json')
        .then(res => res.json())
        .then(data => {
            cardList = data;
        })
        .catch(() => {
            resultDiv.textContent = 'カードリストの読み込みに失敗しました。';
        });

    // 64進文字列を10進数に変換（修正）
    function base64ToDecimal(str) {
        let num = 0;
        for (let i = 0; i < str.length; i++) {
            const idx = hashChars.indexOf(str[i]);
            if (idx === -1) continue;
            num = num * 64 + idx;
        }
        return num;
    }

    // URL の ?hash=... 部分からトークンを取り出し、可能なら id に変換（card_list を参照）
    function decodeHashFromUrl(url) {
        // ?hash= の値を取り出す（URLエンコードを含む可能性があるので % も許可）
        const match = url.match(/[?&]hash=([0-9A-Za-z.\-_%+]+)/);
        if (!match) return "URLに?hash=が見つかりません";
        const hashPart = match[1];
        const parts = hashPart.split('.');
        if (parts.length < 3) return "ハッシュ部分が見つかりません";
        // 先頭2つをスキップ
        const tokens = parts.slice(2);

        const decodedList = tokens.map(tok => {
            let t = tok;
            try { t = decodeURIComponent(t); } catch (e) { /* デコードできない場合はそのまま */ }
            t = String(t).trim();
            t = t.replace(/\+/g, ' ');
            // すでに数字のみならそのまま id として扱う
            if (/^\d+$/.test(t)) return t;
            // 数字でない場合は base64 表現 -> 10進に変換してみる
            const n = base64ToDecimal(t);
            if (n && String(n).length >= 4) { // 変換結果が妥当そうなら id として返す
                return String(n);
            }
            // それ以外は名前文字列として返す
            return t;
        });

        return decodedList;
    }

    function countDuplicates(arr) {
        const counts = {};
        for (const num of arr) {
            counts[num] = (counts[num] || 0) + 1;
        }
        return counts;
    }

    // --- 変更: 名前（文字列）からカードを検索するユーティリティ ---
    function findCardByIdentifier(identifier) {
        const key = String(identifier).trim();
        if (!key) return null;
        // 1) 名前フィールドで完全一致（大文字小文字を無視）
        const byName = cardList.find(c => c.name && c.name.toLowerCase() === key.toLowerCase());
        if (byName) return byName;
        // 2) 数字（インデックス）として扱う（0ベース）
        const idx = parseInt(key, 10);
        if (!isNaN(idx) && cardList[idx]) return cardList[idx];
        // 3) id フィールドがある場合に一致を試みる
        const byId = cardList.find(c => c.id && String(c.id) === key);
        if (byId) return byId;
        return null;
    }

    // 重複を排除してカードリストを作成（文字列化して重複排除）
    function createUniqueCardList(decodedList) {
        return [...new Set(decodedList.map(x => String(x)))];
    }

    function idToName(id) {
        const found = cardList.find(card => card.id == id.toString());
        return found.name;
    }

    function idToUrl(id) {
        const found = cardList.find(card => card.id == id.toString());
        return found.url;
    }

    // テンプレートにデータを挿入（修正）
    function applyTemplate(name, url, color) {
        return templateText
            .replace(/\$NAME/g, name)
            .replace(/\$URL/g, url)
            .replace(/\$COLOR/g, color);
    }

    // グループごとの色（必要なら追加・変更可）
    const groupColors = [
        { bg: '#e6f7ff', border: '#4f8cff' }, // グループ1
        { bg: '#fffbe6', border: '#ffd700' }, // グループ2
        { bg: '#e6ffe6', border: '#4fcf4f' }, // グループ3
        { bg: '#f0e6ff', border: '#a04fff' }, // グループ4
        { bg: '#ffe6f7', border: '#ff4fa0' }, // グループ5
        { bg: '#e6e6e6', border: '#888' },    // グループ6以降
    ];

    // カード一覧を分割グループで表示
    function displayCardGroups(cards) {
        resultDiv.innerHTML = '';

        // 最初から全カードをグループ1に振り分け
        let groups = [
            { name: 'グループ1', cards: [...cards], color: '#e6f7ff' }
        ];

        function createCardElem(card) {
            const cardDiv = document.createElement('div');
            cardDiv.className = 'draggable-card';
            cardDiv.textContent = card.name;
            cardDiv.draggable = true;
            cardDiv.style.border = '1px solid #aaa';
            cardDiv.style.margin = '2px';
            cardDiv.style.padding = '4px 8px';
            cardDiv.style.background = '#fff';
            cardDiv.style.cursor = 'grab';
            cardDiv.style.userSelect = 'none';
            // cardDiv.style.width = '100%';

            cardDiv.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('cardName', card.name);
                e.dataTransfer.setData('cardId', card.id ?? '');
                e.dataTransfer.setData('fromGroupIdx', card._groupIdx ?? '');
                e.dataTransfer.setData('fromCardIdx', card._cardIdx ?? '');
                e.dataTransfer.effectAllowed = 'move';
            });

            return cardDiv;
        }

        function renderGroups() {
            // 出力用flexが残っていたら削除（ボタンの位置ズレ防止）
            document.querySelectorAll('.group-output-flex').forEach(e => e.remove());
            let groupArea = document.getElementById('group-area');
            if (!groupArea) {
                groupArea = document.createElement('div');
                groupArea.id = 'group-area';
                resultDiv.appendChild(groupArea);
            }
            groupArea.innerHTML = '';

            // グループ数
            const total = groups.length;
            const flexBasis = `${100 / total}%`;

            groupArea.style.display = 'flex';
            groupArea.style.gap = '32px';
            groupArea.style.justifyContent = 'center';
            groupArea.style.alignItems = 'flex-start';
            groupArea.style.flexWrap = 'nowrap';
            groupArea.style.maxWidth = '1800px';
            groupArea.style.marginLeft = 'auto';
            groupArea.style.marginRight = 'auto';

            // --- 未割り当てカードは廃止 ---
            // --- グループ ---
            groups.forEach((group, gIdx) => {
                const groupDiv = document.createElement('div');
                groupDiv.className = 'group-box';
                groupDiv.style.display = 'flex';
                groupDiv.style.flexDirection = 'column';
                groupDiv.style.alignItems = 'stretch';
                groupDiv.style.background = group.color;
                groupDiv.style.border = '2px solid #888';
                groupDiv.style.borderRadius = '10px';
                groupDiv.style.padding = '12px';
                groupDiv.style.width = '340px';
                groupDiv.style.minWidth = '240px';
                groupDiv.style.maxWidth = '400px';
                groupDiv.style.height = '800px';
                groupDiv.style.boxSizing = 'border-box';
                groupDiv.style.overflow = 'hidden';

                const title = document.createElement('h3');
                title.textContent = group.name;
                groupDiv.appendChild(title);


                // カードリスト
                const groupList = document.createElement('div');
                groupList.style.flex = '1 1 auto';
                groupList.style.overflowY = 'auto';
                groupList.style.display = 'flex';
                groupList.style.flexDirection = 'column';
                groupList.style.gap = '2px';

                // D&D: ドロップ受け入れ
                groupList.addEventListener('dragover', (e) => {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = 'move';
                    groupList.style.background = '#e0e0e0';
                });
                groupList.addEventListener('dragleave', (e) => {
                    groupList.style.background = '';
                });
                groupList.addEventListener('drop', (e) => {
                    e.preventDefault();
                    groupList.style.background = '';
                    const cardName = e.dataTransfer.getData('cardName');
                    const cardId = e.dataTransfer.getData('cardId');
                    // カード特定
                    let movedCard = null;
                    if (cardId) {
                        movedCard = cardList.find(c => String(c.id) === cardId);
                    }
                    if (!movedCard && cardName) {
                        movedCard = cardList.find(c => c.name === cardName);
                    }
                    if (!movedCard) return;
                    // 既存グループから除去
                    for (let g of groups) {
                        const idx = g.cards.findIndex(c => c.name === movedCard.name);
                        if (idx !== -1) {
                            g.cards.splice(idx, 1);
                        }
                    }
                    // このグループに追加
                    groups[gIdx].cards.push(movedCard);
                    renderGroups();
                });

                // フォントサイズ自動調整
                let groupFontSize = '1em';
                if (group.cards.length > 30) groupFontSize = '0.7em';
                else if (group.cards.length > 20) groupFontSize = '0.8em';
                else if (group.cards.length > 10) groupFontSize = '0.9em';
                groupList.style.fontSize = groupFontSize;

                group.cards.forEach((card, idx) => {
                    card._groupIdx = gIdx;
                    card._cardIdx = idx;
                    groupList.appendChild(createCardElem(card));
                });

                // グループ内末尾へのドロップ対応
                groupList.addEventListener('dragover', (e) => {
                    e.preventDefault();
                    // 空欄ハイライト
                    if (group.cards.length === 0) {
                        groupList.style.background = '#e0e0e0';
                    }
                });
                groupList.addEventListener('dragleave', (e) => {
                    groupList.style.background = '';
                });
                groupList.addEventListener('drop', (e) => {
                    e.preventDefault();
                    groupList.style.background = '';
                    const cardName = e.dataTransfer.getData('cardName');
                    const cardId = e.dataTransfer.getData('cardId');
                    const fromGroupIdx = parseInt(e.dataTransfer.getData('fromGroupIdx'), 10);
                    const fromCardIdx = parseInt(e.dataTransfer.getData('fromCardIdx'), 10);
                    if (isNaN(fromGroupIdx) || isNaN(fromCardIdx)) return;
                    const toGroupIdx = gIdx;
                    if (fromGroupIdx !== toGroupIdx) return; // グループ間は従来通り
                    // 末尾に移動
                    const arr = groups[toGroupIdx].cards;
                    const [moved] = arr.splice(fromCardIdx, 1);
                    arr.push(moved);
                    renderGroups();
                });
                groupDiv.appendChild(groupList);

                // 色選択UI
                const colorLabel = document.createElement('label');
                colorLabel.textContent = '背景色: ';
                colorLabel.style.marginRight = '4px';
                const colorPicker = document.createElement('input');
                colorPicker.type = 'color';
                colorPicker.value = group.color;
                colorPicker.oninput = (e) => {
                    group.color = e.target.value;
                    groupDiv.style.background = group.color;
                };
                colorLabel.appendChild(colorPicker);

                const colorArea = document.createElement('div');
                colorArea.className = 'color-picker';
                colorArea.style.marginTop = '12px';
                colorArea.appendChild(colorLabel);
                groupDiv.appendChild(colorArea);

                groupArea.appendChild(groupDiv);
            });

            // --- グループ追加ボタンと出力ボタンを横並びで配置 ---
            // まずラッパーdivを用意
            let btnWrap = document.getElementById('group-btn-wrap');
            if (btnWrap) btnWrap.remove();
            btnWrap = document.createElement('div');
            btnWrap.id = 'group-btn-wrap';
            btnWrap.style.display = 'flex';
            btnWrap.style.gap = '12px';
            btnWrap.style.marginTop = '20px';
            btnWrap.style.justifyContent = 'center';
            btnWrap.style.alignItems = 'center';

            // グループ追加ボタン
            const addBtn = document.createElement('button');
            addBtn.id = 'add-group-btn';
            addBtn.textContent = 'グループ追加';
            // addBtn.style.height = '40px';
            addBtn.style.fontSize = '1.1em';
            addBtn.style.background = '#357ae8';
            addBtn.style.border = '1.5px solid #aaa';
            addBtn.style.borderRadius = '8px';
            addBtn.style.cursor = 'pointer';
            addBtn.onclick = () => {
                const idx = groups.length + 1;
                groups.push({
                    name: `グループ${idx}`,
                    cards: [],
                    color: groupColors[(idx-1)%groupColors.length]?.bg || '#e6e6e6'
                });
                renderGroups();
            };
            btnWrap.appendChild(addBtn);

            // テンプレート出力ボタン
            let outputBtn = document.getElementById('output-btn');
            if (outputBtn) outputBtn.remove();
            outputBtn = document.createElement('button');
            outputBtn.id = 'output-btn';
            outputBtn.textContent = 'テンプレート出力';
            // outputBtn.style.height = '40px';
            outputBtn.style.fontSize = '1.1em';
            outputBtn.style.background = '#357ae8';
            outputBtn.style.border = '1.5px solid #aaa';
            outputBtn.style.borderRadius = '8px';
            outputBtn.style.cursor = 'pointer';
            outputBtn.onclick = () => {
                // 既存の出力をクリア
                document.querySelectorAll('.group-output-flex').forEach(e => e.remove());
                // 横並びflexコンテナ
                const flexWrap = document.createElement('div');
                flexWrap.className = 'group-output-flex';
                flexWrap.style.display = 'flex';
                flexWrap.style.gap = '32px';
                flexWrap.style.justifyContent = 'center';
                flexWrap.style.alignItems = 'flex-start';
                flexWrap.style.marginTop = '24px';
                flexWrap.style.width = '100%';
                flexWrap.style.overflowX = 'auto';

                groups.forEach((group, idx) => {
                    if (group.cards.length === 0) return;
                    let output = `{|width="100%"\n|w(25%):center:|w(75%):|c\n`;
                    group.cards.forEach(card => {
                        output += applyTemplate(card.name, card.url, group.color) + '\n';
                    });
                    output += '|}\n\n';

                    // グループ出力ボックス
                    const box = document.createElement('div');
                    box.className = 'group-output-box';
                    box.style.display = 'flex';
                    box.style.flexDirection = 'column';
                    box.style.alignItems = 'stretch';
                    box.style.background = group.color;
                    box.style.border = '2px solid #888';
                    box.style.borderRadius = '10px';
                    box.style.padding = '12px';
                    box.style.width = '340px';
                    box.style.minWidth = '240px';
                    box.style.maxWidth = '400px';
                    box.style.height = '260px';
                    box.style.boxSizing = 'border-box';
                    box.style.overflow = 'hidden';

                    // グループ名ラベル
                    const label = document.createElement('div');
                    label.className = 'group-output-label';
                    label.textContent = group.name;
                    label.style.fontWeight = 'bold';
                    label.style.marginBottom = '8px';
                    label.style.fontSize = '1.1em';
                    box.appendChild(label);

                    // テキストエリア
                    const groupOutput = document.createElement('textarea');
                    groupOutput.className = 'group-output-textarea';
                    groupOutput.style.width = '100%';
                    groupOutput.style.height = '140px';
                    groupOutput.style.background = '#fff';
                    groupOutput.style.resize = 'vertical';
                    groupOutput.value = output;
                    box.appendChild(groupOutput);

                    // コピー用ボタン
                    const copyBtn = document.createElement('button');
                    copyBtn.textContent = 'コピー';
                    copyBtn.style.marginTop = '8px';
                    copyBtn.style.alignSelf = 'flex-end';
                    copyBtn.style.padding = '4px 16px';
                    copyBtn.style.fontSize = '1em';
                    copyBtn.style.background = '#357ae8';
                    copyBtn.style.color = '#fff';
                    copyBtn.style.border = '1px solid #357ae8';
                    copyBtn.style.borderRadius = '6px';
                    copyBtn.style.cursor = 'pointer';
                    copyBtn.onclick = (e) => {
                        groupOutput.select();
                        document.execCommand('copy');
                        // カーソル付近に通知を表示
                        const toast = document.createElement('div');
                        toast.textContent = 'コピーしました!';
                        toast.style.position = 'fixed';
                        toast.style.left = (e.clientX + 12) + 'px';
                        toast.style.top = (e.clientY - 16) + 'px';
                        toast.style.background = '#222';
                        toast.style.color = '#fff';
                        toast.style.padding = '4px 14px';
                        toast.style.fontSize = '0.95em';
                        toast.style.borderRadius = '8px';
                        toast.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)';
                        toast.style.zIndex = 9999;
                        toast.style.pointerEvents = 'none';
                        document.body.appendChild(toast);
                        setTimeout(() => {
                            toast.remove();
                        }, 1000);
                    };
                    box.appendChild(copyBtn);

                    flexWrap.appendChild(box);
                });
                resultDiv.appendChild(flexWrap);
            };
            btnWrap.appendChild(outputBtn);

            resultDiv.appendChild(btnWrap);
        }

        renderGroups();
    }

    // --- QRコードデコード ---
    document.getElementById('decode-button').addEventListener('click', async () => {
        resultDiv.textContent = '';
        if (fileInput.files.length === 0) {
            resultDiv.textContent = '画像ファイルを選択してください。';
            return;
        }

        const file = fileInput.files[0];
        try {
            const qrResult = await decodeQRCode(file);
            const decodedList = decodeHashFromUrl(qrResult);
            if (typeof decodedList === "string") {
                resultDiv.textContent = decodedList;
                return;
            }

            const uniqueTokens = [...new Set(decodedList.map(x => String(x).trim()).filter(Boolean))];
            const uniqueByName = new Map();
            const notFound = [];

            uniqueTokens.forEach(tok => {
                if (!tok) return;
                let card = cardList.find(c => c.id && String(c.id) === String(tok));
                if (!card) {
                    card = cardList.find(c => c.name && c.name.toLowerCase() === String(tok).toLowerCase());
                }
                if (card) {
                    if (!uniqueByName.has(card.name)) uniqueByName.set(card.name, card);
                } else {
                    notFound.push(tok);
                }
            });

            const cards = Array.from(uniqueByName.values());
            displayCardGroups(cards);

            if (notFound.length) {
                const notFoundDiv = document.createElement('div');
                notFoundDiv.style.marginTop = '10px';
                notFoundDiv.style.color = 'red';
                notFoundDiv.textContent = `見つからなかったトークン: ${notFound.join(', ')}`;
                resultDiv.appendChild(notFoundDiv);
            }

        } catch (err) {
            resultDiv.textContent = String(err);
        }
    });

    const imagePreview = document.getElementById('image-preview');

    // プレビュー領域クリックでファイル選択ダイアログを開く
    imagePreview.addEventListener('click', () => {
        fileInput.click();
    });
    // キーボード操作にも対応（Enter/Spaceで開く）
    imagePreview.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            fileInput.click();
        }
    });

    // 初期プレースホルダー表示
    function showImagePlaceholder() {
        imagePreview.innerHTML = '<div class="preview-label">デッキ画像を選択</div>';
    }
    showImagePlaceholder();

    // ファイル選択時にプレビューを表示
    fileInput.addEventListener('change', (e) => {
        imagePreview.innerHTML = ''; // プレビューをクリア
        const file = e.target.files[0];
        if (!file) {
            showImagePlaceholder();
            return;
        }

        if (file.type.startsWith('image/')) {
            const img = document.createElement('img');
            img.file = file;

            const reader = new FileReader();
            reader.onload = (e) => {
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);

            imagePreview.appendChild(img);
        }
    });
});