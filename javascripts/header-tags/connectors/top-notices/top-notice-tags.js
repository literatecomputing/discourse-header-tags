import { ajax } from "discourse/lib/ajax";
import { withPluginApi } from "discourse/lib/plugin-api";

const container = Discourse.__container__;

function alphaId(a, b) {
  if (a.id < b.id) {
    return -1;
  }
  if (a.id > b.id) {
    return 1;
  }
  return 0;
}

function tagCount(a, b) {
  if (a.count > b.count) {
    return -1;
  }
  if (a.count < b.count) {
    return 1;
  }
  return 0;
}

export default {
  setupComponent(attrs, component) {
    component.set("hideheader", true);
    var topNotices = document.querySelector(".container");
    console.log("TN:", topNotices);
    topNotices.classList.add("with-header");

    if (!this.site.mobileView) {
      withPluginApi("0.11", (api) => {
        api.onPageChange((url) => {
          console.log("page change", url)
          // let tagRegex = /^\/tag[s]?\/(.*)/;
          let tagRegex = /latest|categories|\/$|\/c\/(.*)/;

          if (settings.enable_tag_cloud) {
            console.log('enable cloud', tagRegex, url);
            console.log("Discoverlist", this.discoveryList);
            console.log("Reg", url, tagRegex, "match", url.match(tagRegex));
            if (this.discoveryList || url.match(tagRegex)) {
              console.log('disc or match');
              // tag pages aren't discovery lists for some reason?
              // checking for discoveryList makes sure it's not loading on user profiles and other topic lists

              if (this.isDestroyed || this.isDestroying) {
                return;
              }

              component.set("isDiscoveryList", true);
              console.log("discoverlist");

              ajax("/tags.json").then(function (result) {
                let tagsCategories = result.extras.categories;
                let tagsAll = result.tags;
                let includeTags = ["economics", "public-health", "geospatial", "finance",
                  "environmental-sciences", "core-places", "data-science", "geometry", "patterns"];
                let foundTags = [];
                let matchTags = tagsAll.filter(item => {
                  return (includeTags.indexOf(item.id) >= 0);
                });
                console.log("includetags", includeTags, tagsAll, matchTags);

                if (url.match(/^\/c\/(.*)/)) {
                  // if category
                  const controller = container.lookup(
                    "controller:navigation/category"
                  );
                  let category = controller.get("category");
                  component.set("category", category);

                  if (tagsCategories.find(({ id }) => id === category.id)) {
                    component.set("hideheader", false);
                    // if category has a tag list
                    let categoryId = tagsCategories.find(
                      ({ id }) => id === category.id
                    );
                    if (settings.sort_by_popularity) {
                      foundTags = categoryId.tags.sort(tagCount);
                    } else {
                      foundTags = categoryId.tags.sort(alphaId);
                    }
                  } else {
                    // if a category doesn't have a tag list, don't show tags
                    document
                      .querySelector(".top-notices-outlet")
                      .classList.remove("with-header");
                    return;
                  }
                } else {
                  console.log('not hide header');
                  // show tags on generic topic pages like latest, top, etc... also tag pages
                  component.set("hideheader", false);
                  if (settings.sort_by_popularity) {
                    foundTags = matchTags.sort(tagCount);
                  } else {
                    foundTags = matchTags.sort(alphaId);
                  }
                }

                if (
                  !(
                    component.get("isDestroyed") ||
                    component.get("isDestroying")
                  )
                ) {
                  component.set("tagList", foundTags.slice(0, settings.number_of_tags));
                }
              });
            } else {
              console.log('no discoverylist');
              component.set("isDiscoveryList", false);
            }
          }
        });
      });
    }
  },
};
