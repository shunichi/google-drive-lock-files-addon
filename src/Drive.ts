/**
 * Callback for rendering the card for specific Drive items.
 * @param {Object} e The event object.
 * @return {CardService.Card} The card to show to the user.
 */
 function onDriveItemsSelected(e: GoogleAppsScript.Addons.EventObject) {
  var items = e.drive!.selectedItems;
  const unspportedTypes = [
    'application/vnd.google-apps.folder',
    'application/vnd.google-apps.shortcut',
  ];
  items = items.filter(item => !unspportedTypes.includes(item.mimeType));
  return createFilesCard(e.commonEventObject.userLocale, items);
}

const messages = {
  en: {
    pleaseSelectFiles: 'Please select files.',
    lockFiles: 'Lock files',
    unlockFiles: 'Unlock files',
    lockedNFiles: 'Locked %{count} file(s)',
    unlockedNFiles: 'Unlocked %{count} file(s)',
  },
  ja: {
    pleaseSelectFiles: 'ファイルを選択してください',
    lockFiles: 'ロックする',
    unlockFiles: 'ロック解除する',
    lockedNFiles: '%{count}個のファイルをロックしました',
    unlockedNFiles: '%{count}個のファイルをロック解除しました',
  },
};
const messageLocales = Object.keys(messages);

function getMessage(locale: string | undefined, key: string, params: Record<string, string> = {}): string {
  const l = locale == null ? 'en' : (messageLocales.includes(locale) ? locale : 'en');
  let m = messages[l][key];
  for (const [key, str] of Object.entries(params)) {
    m = m.replace(`%{${key}}`, str);
  }
  return m;
}

// https://developers.google.com/apps-script/add-ons/concepts/event-objects
function onHomepage(e: GoogleAppsScript.Addons.EventObject) {
  return createHomepageCard(e.commonEventObject.userLocale);
}

function createHomepageCard(locale: string | undefined) {
  const pargraph = CardService.newTextParagraph().setText(getMessage(locale, 'pleaseSelectFiles'));

  // Create a footer to be shown at the bottom.
  var footer = CardService.newFixedFooter()
      .setPrimaryButton(CardService.newTextButton()
          .setText('View source code')
          .setOpenLink(CardService.newOpenLink()
              .setUrl('https://github.com/shunichi/google-drive-lock-files-addon')));

  // Assemble the widgets and return the card.
  var section = CardService.newCardSection()
      .addWidget(pargraph);
  var card = CardService.newCardBuilder()
      .addSection(section)
      .setFixedFooter(footer);
  return card.build();
}

function createFilesCard(locale: string | undefined, items: GoogleAppsScript.Addons.DriveItemObject[]) {
  // https://developers.google.com/apps-script/add-ons/concepts/event-objects#drive_item
  const itemData = items.map((item) => ({ id: item.id, title: item.title, iconUrl: item.iconUrl, mimeType: item.mimeType, addonHasFileScopePermission: item.addonHasFileScopePermission }));

  if (itemData.length === 0) {
    return createHomepageCard(locale);
  }

  const texts = items.map((item) => {
    const icon = CardService.newIconImage().setIconUrl(item.iconUrl);
    const decoratedText = CardService.newDecoratedText()
    .setText(item.title)
    .setStartIcon(icon);
    return decoratedText;
  });

  // Create a button that changes the cat image when pressed.
  // Note: Action parameter keys and values must be strings.
  const action = CardService.newAction()
      .setFunctionName('onLockFiles')
      .setParameters({ data: JSON.stringify(itemData) });
  const button = CardService.newTextButton()
      .setText(getMessage(locale, 'lockFiles'))
      .setOnClickAction(action)
      .setTextButtonStyle(CardService.TextButtonStyle.FILLED);
  const action2 = CardService.newAction()
      .setFunctionName('onUnlockFiles')
      .setParameters({ data: JSON.stringify(itemData) });
  const button2 = CardService.newTextButton()
      .setText(getMessage(locale, 'unlockFiles'))
      .setOnClickAction(action2)
      .setTextButtonStyle(CardService.TextButtonStyle.FILLED);

  const buttonSet = CardService.newButtonSet()
      .addButton(button)
      .addButton(button2);

  // Create a footer to be shown at the bottom.
  const footer = CardService.newFixedFooter()
      .setPrimaryButton(CardService.newTextButton()
          .setText('View source code')
          .setOpenLink(CardService.newOpenLink()
              .setUrl('https://github.com/shunichi/google-drive-lock-files-addon')));

  // Assemble the widgets and return the card.
  const section = CardService.newCardSection();
  section.addWidget(buttonSet);
  texts.forEach((text) => section.addWidget(text));
  const card = CardService.newCardBuilder()
      .addSection(section)
      .setFixedFooter(footer);

  return card.build();
}

function onLockFiles(e: any) {
  const data = JSON.parse(e.parameters.data) as GoogleAppsScript.Addons.DriveItemObject[];

  let count = 0;
  data.forEach((item) => {
    try {
      Drive.Files!.patch({contentRestrictions: [{readOnly: true}]}, item.id, { supportsAllDrives: true });
      count += 1;
    } catch (error) {
      console.log(error.message);
    }
  });

  let message = getMessage(e.commonEventObject.userLocale, 'lockedNFiles', { count: count.toString() });
  return CardService.newActionResponseBuilder()
      .setNotification(CardService.newNotification()
        .setText(message))
      .build();
}

function onUnlockFiles(e: any) {
  const data = JSON.parse(e.parameters.data) as GoogleAppsScript.Addons.DriveItemObject[];

  let count = 0;
  data.forEach((item) => {
    try {
      Drive.Files!.patch({contentRestrictions: [{readOnly: false}]}, item.id, { supportsAllDrives: true });
      count += 1;
    } catch (error) {
      console.log(error.message);
    }
  });

  const message = getMessage(e.commonEventObject.userLocale, 'unlockedNFiles', { count: count.toString() });
  return CardService.newActionResponseBuilder()
      .setNotification(CardService.newNotification()
        .setText(message))
      .build();
}
