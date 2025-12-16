import requests
import time
import json

BASE_LIST_URL = "https://shadowverse-wb.com/web/CardList/cardList"
OFFSET_STEP = 30
CARD_SET = "10004"

def get_all_card_id_name_pairs():
    result = []
    offset = 0
    while True:
        params = {
            "offset": offset,
            "class": "0,1,2,3,4,5,6,7",
            "cost": "0,1,2,3,4,5,6,7,8,9,10",
            "card_set": CARD_SET,
        }
        req = requests.Request('GET', BASE_LIST_URL, params=params).prepare()
        print(f"GET: {req.url}")
        resp = requests.get(BASE_LIST_URL, params=params)
        data = resp.json()
        card_details = data.get("data", {}).get("card_details", {})
        if not card_details:
            break
        for card_id, card_info in card_details.items():
            # idが"9"で始まるものは除外
            if card_id.startswith("9"):
                continue
            name = card_info.get("common", {}).get("name")
            if name:
                result.append({"id": card_id, "name": name, "url": ""})
        offset += OFFSET_STEP
        time.sleep(0.2)
    return result

def main():
    result = get_all_card_id_name_pairs()
    with open("card_id_name.json", "w", encoding="utf-8") as f:
        json.dump(result, f, ensure_ascii=False, indent=2)
    print(f"書き出し完了: {len(result)}件")

if __name__ == "__main__":
    main()