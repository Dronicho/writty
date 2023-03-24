export class CreateArticleDto {
  body: any;
  title: string;
  address: string;
  price: number;
  supply: number;
}

export class UpdateArticleDto {
  internalUrl: string;
  body: any;
}
