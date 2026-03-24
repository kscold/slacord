#!/usr/bin/env python3
"""
Confluence → Slacord Document Importer
Breeder 스페이스의 모든 페이지를 Slacord pawpong 팀 문서로 임포트
"""

import os
import requests
import json
import time
from markdownify import markdownify as md

# Confluence 설정
CONFLUENCE_BASE = "https://breedermatch.atlassian.net/wiki/rest/api"
CONFLUENCE_EMAIL = "developerkscold@gmail.com"
CONFLUENCE_TOKEN = os.environ.get("CONFLUENCE_TOKEN", "")
SPACE_KEY = "Breeder"

# Slacord 설정
SLACORD_BASE = "https://slacord.cloud/api"
SLACORD_EMAIL = "developerkscold@gmail.com"
SLACORD_PASSWORD = os.environ.get("SLACORD_PASSWORD", "")
TEAM_ID = "69c253f44fc9f750b7034ff7"


def confluence_get(path, params=None):
    """Confluence API GET"""
    resp = requests.get(
        f"{CONFLUENCE_BASE}{path}",
        params=params,
        auth=(CONFLUENCE_EMAIL, CONFLUENCE_TOKEN),
    )
    resp.raise_for_status()
    return resp.json()


def slacord_login():
    """Slacord 로그인 → JWT 토큰"""
    resp = requests.post(
        f"{SLACORD_BASE}/auth/login",
        json={"email": SLACORD_EMAIL, "password": SLACORD_PASSWORD},
    )
    resp.raise_for_status()
    return resp.json()["data"]["accessToken"]


def slacord_create_doc(token, team_id, title, content, parent_id=None):
    """Slacord 문서 생성"""
    payload = {"title": title, "content": content}
    if parent_id:
        payload["parentId"] = parent_id
    resp = requests.post(
        f"{SLACORD_BASE}/team/{team_id}/document",
        json=payload,
        headers={"Authorization": f"Bearer {token}"},
    )
    resp.raise_for_status()
    return resp.json()["data"]


def fetch_all_confluence_pages():
    """Breeder 스페이스 전체 페이지 가져오기"""
    all_pages = []
    start = 0
    limit = 100

    while True:
        data = confluence_get(
            "/content",
            params={
                "spaceKey": SPACE_KEY,
                "limit": limit,
                "start": start,
                "expand": "body.storage,ancestors",
            },
        )
        pages = data.get("results", [])
        all_pages.extend(pages)
        print(f"  Fetched {len(all_pages)} pages...")

        if len(pages) < limit:
            break
        start += limit

    return all_pages


def html_to_markdown(html):
    """Confluence HTML → 마크다운 변환"""
    if not html:
        return ""
    # Confluence 매크로 태그 정리
    markdown = md(html, heading_style="ATX", bullets="-", strip=["ac:structured-macro", "ac:parameter", "ac:plain-text-body", "ac:rich-text-body"])
    # 과도한 빈줄 정리
    lines = markdown.split("\n")
    cleaned = []
    blank_count = 0
    for line in lines:
        if line.strip() == "":
            blank_count += 1
            if blank_count <= 2:
                cleaned.append(line)
        else:
            blank_count = 0
            cleaned.append(line)
    return "\n".join(cleaned).strip()


def build_tree(pages):
    """페이지들의 트리 구조 파악 (ancestors 기반)"""
    # ancestor path → category 매핑
    categories = {}
    for page in pages:
        ancestors = page.get("ancestors", [])
        if len(ancestors) >= 2:
            # 최상위 카테고리 = ancestors[1] (ancestors[0]은 Breeder 루트)
            cat_title = ancestors[1]["title"]
        elif len(ancestors) == 1:
            cat_title = "__root__"
        else:
            cat_title = "__root__"

        if cat_title not in categories:
            categories[cat_title] = []
        categories[cat_title].append(page)

    return categories


def main():
    print("=== Confluence → Slacord Document Importer ===\n")

    # 1. Slacord 로그인
    print("[1/4] Slacord 로그인...")
    token = slacord_login()
    print(f"  로그인 성공!\n")

    # 2. Confluence 페이지 전부 가져오기
    print("[2/4] Confluence Breeder 스페이스 페이지 가져오는 중...")
    pages = fetch_all_confluence_pages()
    print(f"  총 {len(pages)}개 페이지 로드 완료\n")

    # 3. 카테고리별 트리 구성
    print("[3/4] 카테고리 분류 중...")
    categories = build_tree(pages)
    for cat, cat_pages in categories.items():
        label = cat if cat != "__root__" else "(루트)"
        print(f"  {label}: {len(cat_pages)}개")
    print()

    # 4. Slacord에 문서 생성
    print("[4/4] Slacord pawpong 팀에 문서 임포트 시작...\n")

    # 카테고리별 폴더 문서 먼저 생성
    cat_doc_ids = {}
    success = 0
    fail = 0

    for cat_name in sorted(categories.keys()):
        if cat_name == "__root__":
            continue
        try:
            doc = slacord_create_doc(token, TEAM_ID, f"📁 {cat_name}", f"*Confluence Breeder 스페이스에서 가져온 '{cat_name}' 카테고리 문서입니다.*")
            cat_doc_ids[cat_name] = doc["id"]
            print(f"  📁 카테고리 생성: {cat_name} (id: {doc['id']})")
            time.sleep(0.2)
        except Exception as e:
            print(f"  ❌ 카테고리 생성 실패: {cat_name} - {e}")

    # 루트 문서 먼저 생성
    root_pages = categories.get("__root__", [])
    for page in root_pages:
        title = page["title"]
        html_body = page.get("body", {}).get("storage", {}).get("value", "")
        content = html_to_markdown(html_body)
        try:
            doc = slacord_create_doc(token, TEAM_ID, title, content)
            success += 1
            print(f"  ✅ [{success}] {title}")
            time.sleep(0.15)
        except Exception as e:
            fail += 1
            print(f"  ❌ {title} - {e}")

    # 카테고리별 하위 문서 생성
    for cat_name in sorted(categories.keys()):
        if cat_name == "__root__":
            continue
        parent_id = cat_doc_ids.get(cat_name)
        cat_pages = categories[cat_name]

        for page in cat_pages:
            title = page["title"]
            html_body = page.get("body", {}).get("storage", {}).get("value", "")
            content = html_to_markdown(html_body)

            # ancestors 경로를 문서 상단에 추가
            ancestors = page.get("ancestors", [])
            path = " > ".join([a["title"] for a in ancestors])
            if path:
                content = f"> 📍 **원본 위치**: {path}\n\n{content}"

            try:
                doc = slacord_create_doc(token, TEAM_ID, title, content, parent_id)
                success += 1
                print(f"  ✅ [{success}] {cat_name}/{title}")
                time.sleep(0.15)
            except Exception as e:
                fail += 1
                print(f"  ❌ {cat_name}/{title} - {e}")

    print(f"\n=== 완료! 성공: {success}개, 실패: {fail}개 ===")


if __name__ == "__main__":
    main()
