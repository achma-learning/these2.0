import * as fs from "fs";
import iconv from "iconv-lite";
import cheerio from "cheerio";
import LanguageDetect from "languagedetect";

/*  
[ [ 'english', 0.5969230769230769 ],
  [ 'hungarian', 0.407948717948718 ],
  [ 'latin', 0.39205128205128204 ],
  [ 'french', 0.367948717948718 ],
]
*/
const cleanText = (text: string) => {
    return text.replace(/\s+/g, " ").trim();
  };

function detectLanguage(text: string) {
    const lngDetector = new LanguageDetect();
  const detectedLanguage = lngDetector.detect(text);
  interface LanguageScores {
    [key: string]: number;
  }
  const normalized: LanguageScores = detectedLanguage.reduce((acc, [name, score]) => {
    acc[name.toLowerCase()] = score;
    return acc;
  }, {} as LanguageScores);

  if (normalized['french'] && normalized["english"]) {
    if(normalized["french"] > normalized["english"]) return "Français (fre)"
    else return "Anglais (eng)"
  }
  else{
    return "Français (fre)"
  }

}

export const formatHtmlToJson = (html: string) => {
  // loading cheerio
  const $ = cheerio.load(html);

  // these array
  const theses: These[] = [];

  // iterating in each table of these to grab title author year lang categ tags, ...rest
  $("[id*=div_public]").each((index, element) => {
    const isChildEmpty =
      $(element).text().trim().length === 0 &&
      $(element).children().length === 0;
    if (isChildEmpty) {
      return;
    }

    // title
    const title = cleanText($(element).find(".public_title").text().trim());

    // autheur
    const author = cleanText(
      $(element)
        .find(".public_auteurs")
        .text()
        .trim()
        .replace(/,?\s*Auteur.*$/, "")
        .trim()
    );

    let year = parseInt(
      cleanText($(element).find(".public_year").text().trim()),
      10
    );

    let langue = detectLanguage(title.toLowerCase())

    const category = cleanText($(element).find(".public_categ").text().trim())
      ? cleanText($(element).find(".public_categ").text().trim()).split(":")
      : null;

    let tags: string[] | null = $(element)
      .find(".public_keywords")
      .find("a")
      .map((index, element) => {
        return cleanText($(element).text().trim());
      })
      .get();

    tags = tags.length === 0 ? null : tags;
    tags =
      tags && tags.length === 1
        ? tags[0].includes("-") ? tags[0].split("-").map((tag: string) => tag.trim()) :
        tags[0].includes("–") ? tags[0].split("–").map((tag: string) => tag.trim()) :tags
        : tags;

    let cote = $(element)
      .parents("[id*='Child'], [id*='Parent']")
      .find(".expl_cote")
      .text()
      .trim()
      .replace(" ", "")
      .toUpperCase();

    let ord;

    const matchDoubleRegex = /TH(\d+)-(\d+)/;
    const matchDouble = cote.match(matchDoubleRegex);
    const matchSingle = cote.match(/TH(\d+)/);
    if (matchSingle) {
      cote = $(element)
        .parents("[id*='Child'], [id*='Parent']")
        .find(".expl_cb")
        .text()
        .trim()
        .replace(" ", "")
        .replace("/", "-");
      cote = `TH${cote}`;
      const coteMatchDouble = cote.match(matchDoubleRegex);
      if (coteMatchDouble) {
        ord = Number(coteMatchDouble[1]);
        if (!year) {
          year = 2000 + Number(coteMatchDouble[2]);
        }
      } else {
        ord = NaN;
        if (!year) {
          year = NaN;
        }
      }
    } else {
      ord = Number(matchDouble![1]);
      if (!year) {
        year = 2000 + Number(matchDouble![2]);
      }
    }

    const href =
      year && ord && typeof year === "number" && typeof ord === "number"
        ? `http://wd.fmpm.uca.ma/biblio/theses/annee-htm/FT/${year}/these${
            ord < 10 ? `0${ord}` : ord
          }-${year.toString().slice(2)}.pdf`
        : "not found";

    let membreAssocie: string[] = [];
    // rest as president rapporteur jury and prof
    let members: { president: string; rapporteur: string; jury: string[] } = {
      president: "",
      rapporteur: "",
      jury: [],
    };
    // for remaining fields that all have the class of .public_persofield
    $(element)
      .find(".tr_persofield")
      .each((index, element) => {
        const persOfFiledType = cleanText(
          $(element)
            .children()
            .first()
            .text()
            .trim()
            .replace(":", "")
            .replace(/\s/g, "")
            .toLowerCase()
        );

        // first field is president
        if (persOfFiledType === "president") {
          members["president"] = cleanText(
            $(element).find(".public_persofield").text().trim()
          );
        }

        // second field is rapporteur
        if (persOfFiledType === "rapporteur") {
          members["rapporteur"] = cleanText(
            $(element).find(".public_persofield").text().trim()
          );
        }

        // third field is jury
        if (persOfFiledType === "jury") {
          const juryText = cleanText(
            $(element).find(".public_persofield").text().trim()
          ).split("/");
          members["jury"] = juryText;
        }

        // fifth field is membreassocie
        if (persOfFiledType === "membreassocie") {
          const otherMembers = cleanText(
            $(element).find(".public_persofield").text().trim()
          ).split("/");
          membreAssocie = membreAssocie.concat(otherMembers);
        }
      });

    try {
      theses.push({
        ord,
        year,
        title,
        author,
        langue: langue as "Français (fre)" | "Anglais (eng)",
        category,
        tags,
        ...members,
        membreAssocie: membreAssocie.length === 0 ? null : membreAssocie,
        profs: [
          members.president,
          members.rapporteur,
          ...(members.jury || []),
          ...membreAssocie,
        ].filter((value) => value !== null && value !== undefined),
        href,
      });
    } catch (error) {
      // console.log(rest.ord)
      console.log(author);
      // console.log(rest.jury)
      console.log(error);
      throw new Error("something went wrong");
    }
  });
  return theses.sort((a, b) => {
    // First, compare by year
    if (a.year !== b.year) {
      return a.year - b.year;
    }

    // If years are the same, compare by ord
    return a.ord - b.ord;
  });
};

const baseUrl =
  "http://lib.fmpm.uca.ma/lib/opac_css/index.php?lvl=more_results&mode=extended&tab=catalog";

const headers = {
  accept:
    "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
  "accept-language": "fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7",
  "content-type": "application/x-www-form-urlencoded",
  "upgrade-insecure-requests": "1",
};

const expandData = async (baseHtml: string) => {
  const expandUrl =
    " http://lib.fmpm.uca.ma/lib/opac_css/ajax.php?module=expand_notice&categ=expand_block";
  const expandHeaders = {
    accept: "*/*",
    "accept-language": "fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7",
    "content-type": "application/x-www-form-urlencoded",
  };
  let fullHtml = baseHtml;
  // loading cheerio
  const $ = cheerio.load(baseHtml);
  let display_cmd = "";
  // these array
  let nb_to_send = 0;
  let display_cmd_all = "";

  const imgParams = $(baseHtml).find("img[param]");

  for (const element of imgParams) {
    nb_to_send++;
    display_cmd = $(element).attr("param") || "";
    display_cmd_all += $(element).attr("param");
    if (element !== imgParams[-1]) display_cmd_all += "|*|*|"; // haka tanfar9hum ;
    if (nb_to_send > 40) {
      const response = await fetch(expandUrl, {
        method: "POST",
        headers: expandHeaders,
        body: "display_cmd=" + display_cmd_all,
      });

      nb_to_send = 0;
      display_cmd_all = "";
      const buffer = await response.arrayBuffer();
      const page = iconv
        .decode(Buffer.from(buffer), "ISO-8859-1")
        .replace(//g, "'");

      fullHtml += page;
    }
  }
  if (nb_to_send) {
    const response = await fetch(expandUrl, {
      method: "POST",
      headers: expandHeaders,
      body: "display_cmd=" + display_cmd_all,
    });
    const buffer = await response.arrayBuffer();
    const page = iconv
      .decode(Buffer.from(buffer), "ISO-8859-1")
      .replace(//g, "'");
    fullHtml += page;
  }

  return fullHtml;
};

const getSinglePageContent = async ({
  year,
  nbPerPage = 200,
  page = 1,
}: {
  year: number;
  nbPerPage: number;
  page: number;
}) => {
  const body = new URLSearchParams();
  body.append("search[]", "f_24");
  body.append("inter_0_f_24", "");
  body.append("op_0_f_24", "STARTWITH");
  body.append("field_0_f_24[]", "th");
  body.append("search[]", "f_23");
  body.append("inter_1_f_23", "and");
  body.append("op_1_f_23", "EQ");
  body.append("field_1_f_23[]", `${year}`);
  body.append("page", `${[page]}`);
  body.append("nb_per_page_custom", `${nbPerPage}`);
  body.append("filtre_compare", "");
  body.append("catalog_page", `${[page]}`);
  body.append("affiliate_page", "1");

  try {
    const respone = await fetch(baseUrl, {
      headers,
      body: body,
      method: "POST",
    });
    if (!respone.ok) {
      return {
        error: `HTTP request failed with status code ${respone.status}`,
      };
    }
    const buffer = await respone.arrayBuffer();
    const initialHtmlPage = iconv
      .decode(Buffer.from(buffer), "ISO-8859-1")
      .replace(//g, "'");

    const $ = cheerio.load(initialHtmlPage);
    const fullHtml = await expandData(initialHtmlPage);

    let lastPageExists = $(initialHtmlPage).find(".navbar_last").attr("href");

    let lastPageIndex: number;
    if (!lastPageExists) {
      if (page !== 1) lastPageIndex = page;
      lastPageIndex = 0;
    } else {
      let matchResults = lastPageExists.match(/page\.value=(\d+);/);
      lastPageIndex = Number(matchResults![1]);
    }

    return { lastPageIndex, content: fullHtml };
  } catch (error) {
    console.log("something went wrong", error);
    return { error };
  }
};

export const getAllPageContent = async (year: number) => {
  const { content, lastPageIndex, error } = await getSinglePageContent({
    year,
    nbPerPage: 200,
    page: 1,
  });
  if (error || typeof lastPageIndex === "undefined") {
    return null;
  }
  let endPageNumber = lastPageIndex;
  let fullHtmlContent = content;
  //   if there is no nextPage return the base content
  if (endPageNumber === 0) {
    return fullHtmlContent;
  }

  // Array to hold all the promises
  let promises = [];

  for (let page = 2; page <= endPageNumber; page++) {
    // Push each promise into the promises array
    promises.push(
      getSinglePageContent({
        year,
        nbPerPage: 200,
        page,
      }).then((response) => {
        return response.content;
      })
    );
  }

  // Wait for all promises to resolve using Promise.all
  let contents = await Promise.all(promises);

  // Concatenate all contents into fullHtmlContent
  fullHtmlContent += contents.join("");

  return fullHtmlContent;
};
