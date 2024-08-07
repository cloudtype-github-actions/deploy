# Cloudtype Github Actions - Deploy

이 액션은 소스코드를 클라우드타입으로 배포합니다.

`cloudtype-github-actions/deploy@v2`



## 입력값(Inputs)

## `token`

**필수** 클라우드타입 API Key

## `project`

배포할 프로젝트 이름

## `stage`

배포할 스테이지 이름. 기본값: 기본 스테이지로 설정된 스테이지

## `allStages`

Boolean / true 인 경우 모든 스테이로 배포

#### 다음 입력값 중 한가지 필요

## `file`

배포 설정 파일

## `json`

배포 설정 json 문자열

## `yaml`

배포 설정 yaml 문자열

---

## 사용예제
```yaml
uses: cloudtype-github-actions/deploy@v2
with:
  token: ${{ secrets.CLOUDTYPE_TOKEN }}
  project: myproject
  stage: main
  file: ./examples/myservice.yml
```
