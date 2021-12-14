# Cloudtype Github Actions - Deploy

This action is provided to deploy applications to Cloudtype.

`cloudtype-github-actions/deploy@v1`



## Inputs

## `token`

**Required** Cloudtype Access Token.

## `project`

Deployment target project name.

## `stage`

Deployment target stage name. Default `main stage`.

## `allStages`

Deploy to all stages.

#### One of the items below.

## `file`

Deployment description file.

## `json`

Deployment description json.

## `yaml`

Deployment description yaml.

---

## Example usage
```yaml
uses: cloudtype-github-actions/deploy@v1
with:
  token: ${{ secrets.CLOUDTYPE_TOKEN }}
  project: myproject
  stage: main
  file: ./examples/myservice.yml
```