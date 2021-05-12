export const findFor = (parentId, arr, comments) => {
  const z = [];
  for (let i = 0; i < arr.length; i++) {
    if (arr[i].parent === parentId) {
      let ch = findFor(arr[i].id, arr.slice(i + 1), comments);
      let o = Object.keys(ch).length == 0 ? {} : { children: ch };
      let res = findInArray(comments, arr[i].id);
      z.push(Object.assign(res, o));
    }
  }
  return z;
};

export const findInArray = (arrObj, id) => {
  const found = arrObj.find((element) => element.id === id);
  return found;
};
