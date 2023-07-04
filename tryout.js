 function findDifference(nums1, nums2) {
    let a = new Set(nums1)
    let b = new Set(nums2)

    let arr1 = []
    let arr2 = []

    

    

    
        if(a.has(nums1[i]) && !b.has(nums1[i])){
            arr1.push()
        }
    

    for(let j = 0;j<nums2.length;j++){
        if(b.has(nums2[j]) && !a.has(nums2[j])){
            arr2.push(nums2[j])
        }
    }

    return []
};

console.log(findDifference([1,2,3,3],[2,4,4,6]));